import { Injectable, Logger } from '@nestjs/common';
import { YoutubeService, YoutubeComment } from './youtube.service';
import { NarrativeAuditorService, ContentAuditorResult } from '../ai/auditor.logic';
import { ReportsService } from './reports.service';
import { VectorStoreService, StoredComment } from '../ai/vector-store.service';
import {
  PainPoint,
  ClusterNode,
  ClusterLink,
} from '../reddit/reddit-analysis.service';

export interface YoutubeAnalysisResult {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  analyzedAt: string;
  totalComments: number;
  csvPath: string;
  csvReused: boolean;
  dbReused: boolean;
  reportPath: string;
  painPoints: PainPoint[];
  clusters: {
    nodes: ClusterNode[];
    links: ClusterLink[];
  };
}

export interface YoutubeContentIdeasResult {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  analyzedAt: string;
  totalComments: number;
  csvPath: string;
  csvReused: boolean;
  dbReused: boolean;
  reportPath: string;
  audienceSentiment: string;
  unmetNeed: string;
  contentIdeas: {
    opportunityScore: number;
    demandEvidence: string;
    titleIdea: string;
    format: string;
    hook: string;
  }[];
}

@Injectable()
export class YoutubeAnalysisService {
  private readonly logger = new Logger(YoutubeAnalysisService.name);

  // Comentarios representativos que se pasan al LLM (seleccionados por MMR)
  private readonly COMMENTS_FOR_AI = 15;

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly auditorService: NarrativeAuditorService,
    private readonly reportsService: ReportsService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: Cadena de fallback de 3 capas
  //   1. DB (vectores ya guardados) → MMR directo, 0 API calls
  //   2. CSV en disco → vectorizar con Ollama → guardar en DB → MMR
  //   3. API YouTube → guardar CSV → vectorizar → guardar DB → MMR
  // ─────────────────────────────────────────────────────────────────────────
  private async getCommentsForAnalysis(
    videoId: string,
    videoUrl: string,
    maxComments: number,
  ): Promise<{
    representative: StoredComment[];
    totalComments: number;
    csvPath: string;
    csvReused: boolean;
    dbReused: boolean;
  }> {
    // ── Capa 1: DB ──────────────────────────────────────────────────────────
    if (await this.vectorStore.hasEmbeddings(videoId)) {
      this.logger.log(`✅ Capa 1 (DB): Vectores encontrados para [${videoId}]`);
      const representative = await this.vectorStore.pickRepresentative(videoId, this.COMMENTS_FOR_AI);
      return { representative, totalComments: representative.length, csvPath: '', csvReused: false, dbReused: true };
    }

    // ── Capa 2 y 3: CSV o API ────────────────────────────────────────────────
    let comments: YoutubeComment[];
    let csvPath: string;
    let csvReused: boolean;

    const existingCsv = await this.reportsService.findExistingCsv(videoId);
    if (existingCsv) {
      this.logger.log(`✅ Capa 2 (CSV): Reutilizando ${existingCsv}`);
      comments = await this.reportsService.loadCommentsFromCsv(existingCsv);
      csvPath = existingCsv;
      csvReused = true;
    } else {
      this.logger.log(`📱 Capa 3 (API YouTube): Descargando comentarios de ${videoUrl}`);
      comments = await this.youtubeService.fetchComments(videoId, maxComments);
      csvPath = await this.reportsService.writeCsv(comments, videoId);
      csvReused = false;
    }

    // Vectorizar y guardar en DB (en background-friendly: await para garantizar consistencia)
    await this.vectorStore.saveMany(
      comments.map((c) => ({ externalId: c.id, content: c.text, author: c.author, likeCount: c.likeCount })),
      videoId,
      'youtube',
    );

    const representative = await this.vectorStore.pickRepresentative(videoId, this.COMMENTS_FOR_AI);
    return { representative, totalComments: comments.length, csvPath, csvReused, dbReused: false };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pain Points analysis
  // ─────────────────────────────────────────────────────────────────────────
  async analyzeVideo(
    videoUrl: string,
    maxComments: number = 200,
  ): Promise<YoutubeAnalysisResult> {
    this.logger.log(`Iniciando análisis Pain Points para: ${videoUrl}`);

    const videoId = this.youtubeService.extractVideoId(videoUrl);
    const videoTitle = await this.youtubeService.getVideoTitle(videoId);
    const { representative, totalComments, csvPath, csvReused, dbReused } = await this.getCommentsForAnalysis(videoId, videoUrl, maxComments);

    this.logger.log(`Enviando ${representative.length} comentarios representativos (MMR) al Narrative Auditor...`);

    const analysisResults: any[] = [];
    for (const comment of representative) {
      try {
        const result = await this.auditorService.analyzeNarrative({
          communityName: `YouTube Video: ${videoId}`,
          title: `Comentario de ${comment.author} (${comment.likeCount} likes)`,
          comments: comment.content.slice(0, 1000),
        });
        analysisResults.push({
          title: `${comment.author}: "${comment.content.slice(0, 60)}..."`,
          score: result.frustrationScore,
          opportunity: result.businessOpportunity,
          mainPainPoint: result.mainPainPoint,
          sourceUrl: videoUrl,
        });
      } catch (err) {
        this.logger.warn(`Falló análisis del comentario de ${comment.author}: ${err.message}`);
      }
    }

    const painPoints: PainPoint[] = analysisResults.map((r) => ({
      title: r.title,
      score: r.score,
      opportunity: r.opportunity,
      sourceUrl: r.sourceUrl,
      mainPainPoint: r.mainPainPoint,
    }));

    const clusters = this.buildClusters(analysisResults, videoId);
    const analyzedAt = new Date().toISOString();

    const partial = { videoId, videoTitle, videoUrl, analyzedAt,
      totalComments, csvPath, csvReused, dbReused, reportPath: '', painPoints, clusters };
    const reportPath = await this.exportPainPointsMarkdown(partial);

    return { ...partial, reportPath };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Content Ideas analysis
  // ─────────────────────────────────────────────────────────────────────────
  async analyzeContentIdeas(
    videoUrl: string,
    maxComments: number = 200,
  ): Promise<YoutubeContentIdeasResult> {
    this.logger.log(`Iniciando análisis Content Ideas para: ${videoUrl}`);

    const videoId = this.youtubeService.extractVideoId(videoUrl);
    const videoTitle = await this.youtubeService.getVideoTitle(videoId);
    const { representative, totalComments, csvPath, csvReused, dbReused } = await this.getCommentsForAnalysis(videoId, videoUrl, maxComments);

    this.logger.log(`Enviando bloque de ${representative.length} comentarios representativos (MMR) al Narrative Auditor...`);

    const concatenatedComments = representative
      .map((c) => `- ${c.author} (${c.likeCount} likes): ${c.content}`)
      .join('\n');

    let auditorResult: ContentAuditorResult;
    try {
      auditorResult = await this.auditorService.analyzeContentOpportunity({
        videoTitle: videoTitle,
        comments: concatenatedComments,
      });
    } catch (err) {
      this.logger.error(`Falló análisis de ideas de contenido: ${err.message}`);
      throw err;
    }

    const analyzedAt = new Date().toISOString();
    const partial = {
      videoId, videoTitle, videoUrl, analyzedAt,
      totalComments, csvPath, csvReused, dbReused, reportPath: '',
      audienceSentiment: auditorResult.audienceSentiment,
      unmetNeed: auditorResult.unmetNeed,
      contentIdeas: auditorResult.contentIdeas,
    };
    const reportPath = await this.exportContentIdeasMarkdown(partial);

    return { ...partial, reportPath };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Markdown exporters
  // ─────────────────────────────────────────────────────────────────────────
  private async exportPainPointsMarkdown(result: YoutubeAnalysisResult): Promise<string> {
    try {
      let md = `# Insight Engine — Pain Points Report\n\n`;
      md += `**Título:** ${result.videoTitle}\n`;
      md += `**Video ID:** \`${result.videoId}\`\n`;
      md += `**Video URL:** [Ver en YouTube](${result.videoUrl})\n`;
      md += `**Fecha:** ${new Date(result.analyzedAt).toLocaleString('es-MX')}\n`;
      md += `**Comentarios Extraídos:** ${result.totalComments}\n`;
      md += `**CSV:** \`${result.csvPath.split('/').slice(-1)[0]}\`${result.csvReused ? ' *(reutilizado)*' : ''}\n\n`;
      md += `## Market Pain Points\n\n`;

      if (result.painPoints.length === 0) {
        md += `> No se encontraron pain points suficientes.\n`;
      } else {
        result.painPoints.forEach((pp, idx) => {
          md += `### ${idx + 1}. ${pp.title}\n`;
          md += `- **Frustration Score:** ${pp.score}/10\n`;
          md += `- **Main Pain Point:** ${pp.mainPainPoint}\n`;
          md += `- **Business Opportunity:** ${pp.opportunity}\n`;
          md += `- **Source:** [YouTube Video](${pp.sourceUrl})\n\n`;
        });
      }

      const fileName = `youtube-${result.videoId}-${Date.now()}.md`;
      return this.reportsService.writeMarkdown(md, 'pain-points', fileName);
    } catch (err) {
      this.logger.error(`Error guardando reporte Pain Points MD: ${err.message}`);
      return '';
    }
  }

  private async exportContentIdeasMarkdown(result: YoutubeContentIdeasResult): Promise<string> {
    try {
      let md = `# Insight Engine — Content Ideas Report\n\n`;
      md += `**Título:** ${result.videoTitle}\n`;
      md += `**Video ID:** \`${result.videoId}\`\n`;
      md += `**Video URL:** [Ver en YouTube](${result.videoUrl})\n`;
      md += `**Fecha:** ${new Date(result.analyzedAt).toLocaleString('es-MX')}\n`;
      md += `**Comentarios Analizados:** ${result.totalComments}\n`;
      md += `**CSV:** \`${result.csvPath.split('/').slice(-1)[0]}\`${result.csvReused ? ' *(reutilizado)*' : ''}\n\n`;

      md += `## Análisis de Audiencia\n\n`;
      md += `**Sentimiento General:**\n> ${result.audienceSentiment}\n\n`;
      md += `**Necesidad No Cubierta:**\n> ${result.unmetNeed}\n\n`;

      md += `## Ideas de Contenido (ordenadas por Opportunity Score)\n\n`;
      if (result.contentIdeas.length === 0) {
        md += `> Sin demanda suficiente en los comentarios para generar ideas.\n`;
      } else {
        result.contentIdeas.forEach((idea, idx) => {
          const bar = '█'.repeat(idea.opportunityScore) + '░'.repeat(10 - idea.opportunityScore);
          md += `### ${idx + 1}. "${idea.titleIdea}"\n`;
          md += `- **Opportunity Score:** ${idea.opportunityScore}/10 \`${bar}\`\n`;
          md += `- **Formato:** ${idea.format}\n`;
          md += `- **Evidencia de Demanda:** *${idea.demandEvidence}*\n`;
          md += `- **Hook:** *"${idea.hook}"*\n\n`;
        });
      }

      const fileName = `youtube-${result.videoId}-${Date.now()}.md`;
      return this.reportsService.writeMarkdown(md, 'content-ideas', fileName);
    } catch (err) {
      this.logger.error(`Error guardando reporte Content Ideas MD: ${err.message}`);
      return '';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // D3.js cluster builder (sin cambios)
  // ─────────────────────────────────────────────────────────────────────────
  private buildClusters(
    results: any[],
    videoId: string,
  ): { nodes: ClusterNode[]; links: ClusterLink[] } {
    const nodes: ClusterNode[] = [];
    const links: ClusterLink[] = [];

    nodes.push({ id: 'center', name: `YT: ${videoId}`, group: 0, radius: 28 });

    results.forEach((result, index) => {
      if (!result) return;
      const id = `node-${index}`;
      const group = result.score >= 7 ? 1 : result.score >= 4 ? 2 : 3;
      const radius = 8 + result.score * 1.5;
      const label = result.mainPainPoint?.slice(0, 30) || result.title.slice(0, 30);

      nodes.push({ id, name: label, group, radius });
      links.push({ source: 'center', target: id, value: Math.ceil(result.score / 3) });
    });

    return { nodes, links };
  }
}
