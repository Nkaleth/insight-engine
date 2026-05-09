import { Injectable, Logger } from '@nestjs/common';
import { YoutubeService, YoutubeComment } from './youtube.service';
import { NarrativeAuditorService } from '../ai/auditor.logic';
import {
  PainPoint,
  ClusterNode,
  ClusterLink,
} from '../reddit/reddit-analysis.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface YoutubeAnalysisResult {
  videoId: string;
  videoUrl: string;
  analyzedAt: string;
  totalComments: number;
  csvPath: string;
  painPoints: PainPoint[];
  clusters: {
    nodes: ClusterNode[];
    links: ClusterLink[];
  };
}

@Injectable()
export class YoutubeAnalysisService {
  private readonly logger = new Logger(YoutubeAnalysisService.name);

  // Cuántos comentarios enviamos al LLM como contexto (top N por likes)
  private readonly COMMENTS_FOR_AI = 5;

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly auditorService: NarrativeAuditorService,
  ) {}

  async analyzeVideo(
    videoUrl: string,
    maxComments: number = 200,
  ): Promise<YoutubeAnalysisResult> {
    this.logger.log(`Iniciando análisis de YouTube para: ${videoUrl}`);

    // 1. Extraer videoId desde la URL
    const videoId = this.youtubeService.extractVideoId(videoUrl);

    // 2. Scraping de comentarios con paginación
    const comments = await this.youtubeService.fetchComments(
      videoId,
      maxComments,
    );
    this.logger.log(`Total comentarios extraídos: ${comments.length}`);

    // 3. Exportar TODOS los comentarios a CSV
    const csvPath = await this.youtubeService.exportToCsv(comments, videoId);

    // 4. Seleccionar los top N comentarios por likeCount para el análisis IA
    const topComments = [...comments]
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, this.COMMENTS_FOR_AI);

    this.logger.log(
      `Enviando ${topComments.length} comentarios top al Narrative Auditor...`,
    );

    // 5. Analizar con Ollama — secuencial para no saturar VRAM
    const analysisResults: any[] = [];

    for (const comment of topComments) {
      try {
        const result = await this.auditorService.analyzeNarrative({
          communityName: `YouTube Video: ${videoId}`,
          title: `Comentario de ${comment.author} (${comment.likeCount} likes)`,
          comments: comment.text.slice(0, 1000), // máximo 1000 chars por comentario
        });

        analysisResults.push({
          title: `${comment.author}: "${comment.text.slice(0, 60)}..."`,
          score: result.frustrationScore,
          opportunity: result.businessOpportunity,
          mainPainPoint: result.mainPainPoint,
          sourceUrl: videoUrl,
        });
      } catch (err) {
        this.logger.warn(
          `Falló análisis del comentario de ${comment.author}: ${err.message}`,
        );
      }
    }

    // 6. Construir PainPoints para el NeedFeed
    const painPoints: PainPoint[] = analysisResults.map((r) => ({
      title: r.title,
      score: r.score,
      opportunity: r.opportunity,
      sourceUrl: r.sourceUrl,
      mainPainPoint: r.mainPainPoint,
    }));

    // 7. Generar clusters para el MarketMap (mismo algoritmo que Reddit)
    const clusters = this.buildClusters(analysisResults, videoId);

    const finalResult: YoutubeAnalysisResult = {
      videoId,
      videoUrl,
      analyzedAt: new Date().toISOString(),
      totalComments: comments.length,
      csvPath,
      painPoints,
      clusters,
    };

    // 8. Exportar reporte Markdown
    await this.exportToMarkdown(finalResult);

    return finalResult;
  }

  private async exportToMarkdown(result: YoutubeAnalysisResult): Promise<void> {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      await fs.mkdir(reportsDir, { recursive: true });

      const fileName = `youtube-${result.videoId}-${Date.now()}.md`;
      const filePath = path.join(reportsDir, fileName);

      let mdContent = `# Insight Engine Report: YouTube\n\n`;
      mdContent += `**Video ID:** \`${result.videoId}\`\n`;
      mdContent += `**Video URL:** [Ver en YouTube](${result.videoUrl})\n`;
      mdContent += `**Fecha de Análisis:** ${new Date(result.analyzedAt).toLocaleString('es-MX')}\n`;
      mdContent += `**Total de Comentarios Extraídos:** ${result.totalComments}\n`;
      mdContent += `**CSV Generado:** \`${path.basename(result.csvPath)}\`\n\n`;
      mdContent += `## Market Pain Points\n\n`;

      if (result.painPoints.length === 0) {
        mdContent += `> No se encontraron pain points suficientes en los comentarios analizados.\n`;
      } else {
        result.painPoints.forEach((pp, idx) => {
          mdContent += `### ${idx + 1}. ${pp.title}\n`;
          mdContent += `- **Frustration Score:** ${pp.score}/10\n`;
          mdContent += `- **Main Pain Point:** ${pp.mainPainPoint}\n`;
          mdContent += `- **Business Opportunity:** ${pp.opportunity}\n`;
          mdContent += `- **Source:** [YouTube Video](${pp.sourceUrl})\n\n`;
        });
      }

      await fs.writeFile(filePath, mdContent, 'utf-8');
      this.logger.log(`✅ Reporte Markdown guardado: ${filePath}`);
    } catch (err) {
      this.logger.error(`Error guardando reporte Markdown: ${err.message}`);
    }
  }

  /**
   * Construye nodos y links para D3.js agrupando pain points por nivel de frustración.
   * Idéntico al algoritmo de Reddit para compatibilidad con el MarketMap del frontend.
   * Alta frustración (>=7) = grupo 1, Media (>=4) = grupo 2, Baja = grupo 3
   */
  private buildClusters(
    results: any[],
    videoId: string,
  ): { nodes: ClusterNode[]; links: ClusterLink[] } {
    const nodes: ClusterNode[] = [];
    const links: ClusterLink[] = [];

    // Nodo central: el video analizado
    nodes.push({
      id: 'center',
      name: `YT: ${videoId}`,
      group: 0,
      radius: 28,
    });

    results.forEach((result, index) => {
      if (!result) return;
      const id = `node-${index}`;
      const group = result.score >= 7 ? 1 : result.score >= 4 ? 2 : 3;
      const radius = 8 + result.score * 1.5;

      const label =
        result.mainPainPoint?.slice(0, 30) || result.title.slice(0, 30);

      nodes.push({ id, name: label, group, radius });
      links.push({
        source: 'center',
        target: id,
        value: Math.ceil(result.score / 3),
      });
    });

    return { nodes, links };
  }
}
