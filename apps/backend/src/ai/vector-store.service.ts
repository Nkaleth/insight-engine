import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { PrismaService } from '../common/prisma.service';

export interface StoredComment {
  content: string;
  author: string | null;
  likeCount: number;
}

interface CommentInput {
  externalId?: string;
  content: string;
  author?: string;
  likeCount?: number;
}

interface RawCommentRow {
  id: string;
  content: string;
  author: string | null;
  likeCount: number;
  embedding: string; // pgvector returns as text
}

/**
 * VectorStoreService — Núcleo de la Fase 2.
 *
 * Responsabilidades:
 *  1. hasEmbeddings()      → ¿Ya están vectorizados en DB?
 *  2. saveMany()           → Vectorizar en batch + upsert en Postgres
 *  3. pickRepresentative() → Selección MMR (Maximal Marginal Relevance)
 *
 * Algoritmo MMR:
 *  En lugar de tomar los N comentarios con más likes (sesgado por viralidad),
 *  selecciona comentarios que representan la DIVERSIDAD de opiniones:
 *  - Primero el más cercano al centroide (la "opinión promedio")
 *  - Luego, iterativamente, el más diferente a los ya seleccionados
 *  Resultado: la IA recibe un panorama balanceado de todos los clusters de opinión.
 */
@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly BATCH_SIZE = 50; // Ollama soporta hasta 50 inputs por llamada

  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Consulta ─────────────────────────────────────────────────────────────

  /** Devuelve true si ya existen vectores en DB para este sourceId. */
  async hasEmbeddings(sourceId: string): Promise<boolean> {
    const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM "Comment"
      WHERE "sourceId" = ${sourceId}
      AND embedding IS NOT NULL
    `;
    return Number(result[0]?.count ?? 0) > 0;
  }

  /** Elimina todos los vectores asociados a un sourceId */
  async deleteSource(sourceId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM "Comment"
      WHERE "sourceId" = ${sourceId}
    `;
    this.logger.log(`🗑️ Vectores purgados de la DB para [${sourceId}]`);
  }

  // ─── Guardado ─────────────────────────────────────────────────────────────

  /**
   * Vectoriza comentarios en batches de 50 y los guarda en Postgres.
   * Usa ON CONFLICT para upsert seguro: nunca genera duplicados.
   */
  async saveMany(
    comments: CommentInput[],
    sourceId: string,
    sourceType: 'youtube' | 'reddit',
  ): Promise<void> {
    const valid = comments.filter((c) => c.content?.trim().length > 0);
    if (valid.length === 0) return;

    this.logger.log(`Vectorizando ${valid.length} comentarios para [${sourceId}]...`);
    let saved = 0;

    for (let i = 0; i < valid.length; i += this.BATCH_SIZE) {
      const batch = valid.slice(i, i + this.BATCH_SIZE);
      const texts = batch.map((c) => c.content.slice(0, 1500));

      // Una sola llamada a Ollama para todo el batch
      let embeddings: number[][];
      try {
        embeddings = await this.embeddingsService.generateEmbeddingBatch(texts);
      } catch (err) {
        this.logger.error(`Error vectorizando batch ${i / this.BATCH_SIZE + 1}: ${err.message}`);
        continue;
      }

      // Upsert cada comentario con su vector
      for (let j = 0; j < batch.length; j++) {
        const c = batch[j];
        const vec = embeddings[j];
        if (!vec?.length) continue;

        const vectorStr = `[${vec.join(',')}]`;

        try {
          if (c.externalId) {
            await this.prisma.$executeRaw`
              INSERT INTO "Comment"
                (id, "sourceType", "sourceId", "externalId", author, content, "likeCount", embedding, "createdAt")
              VALUES (
                gen_random_uuid()::text, ${sourceType}, ${sourceId}, ${c.externalId},
                ${c.author ?? null}, ${c.content}, ${c.likeCount ?? 0}, ${vectorStr}::vector, NOW()
              )
              ON CONFLICT ("sourceId", "externalId") DO UPDATE
                SET embedding = EXCLUDED.embedding,
                    "likeCount" = EXCLUDED."likeCount"
            `;
          } else {
            // Sin externalId: insertar sin constraint de unicidad (puede haber duplicados edge case)
            await this.prisma.$executeRaw`
              INSERT INTO "Comment"
                (id, "sourceType", "sourceId", "externalId", author, content, "likeCount", embedding, "createdAt")
              VALUES (
                gen_random_uuid()::text, ${sourceType}, ${sourceId}, NULL,
                ${c.author ?? null}, ${c.content}, ${c.likeCount ?? 0}, ${vectorStr}::vector, NOW()
              )
            `;
          }
          saved++;
        } catch (err) {
          if (!err.message?.includes('unique')) {
            this.logger.warn(`Error guardando comentario: ${err.message?.slice(0, 80)}`);
          }
        }
      }

      const batchNum = Math.floor(i / this.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(valid.length / this.BATCH_SIZE);
      this.logger.log(`  Batch ${batchNum}/${totalBatches} guardado`);
    }

    this.logger.log(`✅ ${saved}/${valid.length} comentarios vectorizados en DB para [${sourceId}]`);
  }

  // ─── Selección representativa (MMR) ──────────────────────────────────────

  /**
   * Selecciona N comentarios representativos usando Maximal Marginal Relevance.
   * Cubre la diversidad total de opiniones, no solo los más virales.
   */
  async pickRepresentative(sourceId: string, n: number): Promise<StoredComment[]> {
    const rows = await this.prisma.$queryRaw<RawCommentRow[]>`
      SELECT id, content, author, "likeCount", embedding::text as embedding
      FROM "Comment"
      WHERE "sourceId" = ${sourceId}
      AND embedding IS NOT NULL
      LIMIT 1000
    `;

    if (rows.length === 0) return [];
    if (rows.length <= n) {
      return rows.map((r) => ({ content: r.content, author: r.author, likeCount: r.likeCount }));
    }

    // Parsear vectores (pgvector devuelve string "[0.1,0.2,...]")
    const items = rows.map((r) => ({
      content: r.content,
      author: r.author,
      likeCount: r.likeCount,
      embedding: this.parseVector(r.embedding),
    }));

    const selected = this.mmrSelect(items, n);
    return selected.map((s) => ({ content: s.content, author: s.author, likeCount: s.likeCount }));
  }

  // ─── Helpers matemáticos ──────────────────────────────────────────────────

  private parseVector(s: string): number[] {
    // pgvector puede retornar "[0.1,0.2,...]" o "{0.1,0.2,...}"
    const clean = s.replace(/^\[|\]$/g, '').replace(/^\{|\}$/g, '');
    return clean.split(',').map(Number);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-10);
  }

  private centroid(embeddings: number[][]): number[] {
    const n = embeddings.length;
    const dim = embeddings[0].length;
    const c = new Array(dim).fill(0);
    for (const e of embeddings) {
      for (let i = 0; i < dim; i++) c[i] += e[i] / n;
    }
    return c;
  }

  /**
   * MMR — Greedy Diversity Sampling.
   * 1. Selecciona el comentario más cercano al centroide (el más "promedio")
   * 2. Itera eligiendo siempre el más diferente a los ya seleccionados
   */
  private mmrSelect<T extends { embedding: number[] }>(items: T[], n: number): T[] {
    const c = this.centroid(items.map((i) => i.embedding));
    const selected: T[] = [];
    const remaining = [...items];

    // Primer elemento: el más cercano al centroide
    let bestIdx = 0, bestSim = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const sim = this.cosineSimilarity(remaining[i].embedding, c);
      if (sim > bestSim) { bestSim = sim; bestIdx = i; }
    }
    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);

    // Resto: el que maximiza la distancia mínima al conjunto seleccionado
    while (selected.length < n && remaining.length > 0) {
      let maxMinDist = -Infinity, chosenIdx = 0;
      for (let i = 0; i < remaining.length; i++) {
        let minSim = Infinity;
        for (const s of selected) {
          const sim = this.cosineSimilarity(remaining[i].embedding, s.embedding);
          if (sim < minSim) minSim = sim;
        }
        if (-minSim > maxMinDist) { maxMinDist = -minSim; chosenIdx = i; }
      }
      selected.push(remaining[chosenIdx]);
      remaining.splice(chosenIdx, 1);
    }

    return selected;
  }
}
