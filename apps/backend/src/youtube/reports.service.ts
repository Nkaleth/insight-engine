import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { YoutubeComment } from './youtube.service';

export interface ReportSummary {
  videoId: string;
  type: 'pain-points' | 'content-ideas';
  fileName: string;
  csvFile: string | null;
  createdAt: string;
}

/**
 * Centraliza la gestión de carpetas, rutas y lectura/escritura de
 * comentarios CSV y reportes Markdown bajo una estructura:
 *
 *   reports/
 *     comments/        ← CSVs de comentarios
 *     pain-points/     ← Reportes .md de Pain Points
 *     content-ideas/   ← Reportes .md de Content Ideas
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly base = path.join(process.cwd(), 'reports');

  get commentsDir() {
    return path.join(this.base, 'comments');
  }
  get painPointsDir() {
    return path.join(this.base, 'pain-points');
  }
  get contentIdeasDir() {
    return path.join(this.base, 'content-ideas');
  }

  /** Crea todas las subcarpetas si no existen */
  async ensureDirs(): Promise<void> {
    await fs.mkdir(this.commentsDir, { recursive: true });
    await fs.mkdir(this.painPointsDir, { recursive: true });
    await fs.mkdir(this.contentIdeasDir, { recursive: true });
  }

  /**
   * Busca el CSV más reciente para un videoId en la carpeta comments/.
   * Devuelve su ruta absoluta o null si no existe.
   */
  async findExistingCsv(videoId: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.commentsDir);
      const matches = files
        .filter((f) => f.startsWith(`youtube-${videoId}-`) && f.endsWith('.csv'))
        .sort()
        .reverse(); // más reciente primero

      if (matches.length > 0) {
        const found = path.join(this.commentsDir, matches[0]);
        this.logger.log(`✅ CSV reutilizado (sin API): ${found}`);
        return found;
      }
    } catch {
      // directorio aún no existe, se creará en ensureDirs
    }
    return null;
  }

  /**
   * Carga los comentarios desde un CSV guardado.
   */
  async loadCommentsFromCsv(csvPath: string): Promise<YoutubeComment[]> {
    const raw = await fs.readFile(csvPath, 'utf-8');
    const lines = raw.split('\n').slice(1).filter(Boolean); // saltar header

    return lines.map((line) => {
      // Parseo básico: "id","author","text",likeCount,"publishedAt"
      const cols = line.match(/("(?:[^"]|"")*"|[^,]+)(?:,|$)/g) ?? [];
      const clean = (s: string) =>
        s?.replace(/^"|"$/g, '').replace(/""/g, '"') ?? '';

      return {
        id: clean(cols[0] ?? ''),
        author: clean(cols[1] ?? ''),
        text: clean(cols[2] ?? ''),
        likeCount: parseInt(clean(cols[3] ?? ''), 10) || 0,
        publishedAt: clean(cols[4] ?? ''),
      };
    });
  }

  /**
   * Escribe los comentarios a un CSV en la carpeta comments/.
   */
  async writeCsv(comments: YoutubeComment[], videoId: string): Promise<string> {
    await this.ensureDirs();
    const fileName = `youtube-${videoId}-${Date.now()}.csv`;
    const filePath = path.join(this.commentsDir, fileName);

    const header = 'id,author,text,likeCount,publishedAt\n';
    const rows = comments
      .map((c) => {
        const escapedText = c.text.replace(/"/g, '""').replace(/\n/g, ' ');
        const escapedAuthor = c.author.replace(/"/g, '""');
        return `"${c.id}","${escapedAuthor}","${escapedText}",${c.likeCount},"${c.publishedAt}"`;
      })
      .join('\n');

    await fs.writeFile(filePath, header + rows, 'utf-8');
    this.logger.log(`✅ CSV guardado: ${filePath}`);
    return filePath;
  }

  /**
   * Guarda un reporte Markdown en la subcarpeta indicada.
   */
  async writeMarkdown(
    content: string,
    subdir: 'pain-points' | 'content-ideas',
    fileName: string,
  ): Promise<string> {
    await this.ensureDirs();
    const filePath = path.join(this.base, subdir, fileName);
    await fs.writeFile(filePath, content, 'utf-8');
    this.logger.log(`✅ Reporte MD guardado: ${filePath}`);
    return filePath;
  }

  /**
   * Lista todos los reportes .md de ambas carpetas para mostrarlos en el frontend.
   */
  async listReports(): Promise<ReportSummary[]> {
    await this.ensureDirs();
    const results: ReportSummary[] = [];

    for (const type of ['pain-points', 'content-ideas'] as const) {
      const dir = path.join(this.base, type);
      try {
        const files = await fs.readdir(dir);
        for (const f of files.filter((x) => x.endsWith('.md'))) {
          const stats = await fs.stat(path.join(dir, f));
          // Nombre: youtube-{videoId}-{timestamp}.md
          const match = f.match(/youtube-([a-zA-Z0-9_-]+)-(\d+)\.md/);
          const videoId = match?.[1] ?? 'unknown';
          const ts = match?.[2] ? new Date(parseInt(match[2])).toISOString() : stats.mtime.toISOString();

          // Buscar CSV relacionado
          let csvFile: string | null = null;
          try {
            const csvFiles = await fs.readdir(this.commentsDir);
            const found = csvFiles
              .filter((c) => c.startsWith(`youtube-${videoId}-`) && c.endsWith('.csv'))
              .sort()
              .reverse()[0];
            if (found) csvFile = found;
          } catch { /* sin CSV */ }

          results.push({ videoId, type, fileName: f, csvFile, createdAt: ts });
        }
      } catch { /* carpeta vacía */ }
    }

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Lee el contenido de un reporte .md por tipo y nombre.
   */
  async readReport(
    type: 'pain-points' | 'content-ideas',
    fileName: string,
  ): Promise<string> {
    const filePath = path.join(this.base, type, fileName);
    return fs.readFile(filePath, 'utf-8');
  }
}
