import { Injectable, Logger } from '@nestjs/common';
import { RedditService } from './reddit.service';
import { NarrativeAuditorService } from '../ai/auditor.logic';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PainPoint {
  title: string;
  score: number;
  opportunity: string;
  sourceUrl: string;
  mainPainPoint?: string;
}

export interface ClusterNode {
  id: string;
  name: string;
  group: number;
  radius: number;
}

export interface ClusterLink {
  source: string;
  target: string;
  value: number;
}

export interface AnalysisResult {
  subreddit: string;
  analyzedAt: string;
  totalPosts: number;
  painPoints: PainPoint[];
  clusters: {
    nodes: ClusterNode[];
    links: ClusterLink[];
  };
}

@Injectable()
export class RedditAnalysisService {
  private readonly logger = new Logger(RedditAnalysisService.name);

  constructor(
    private readonly redditService: RedditService,
    private readonly auditorService: NarrativeAuditorService,
  ) {}

  async analyzeSubreddit(input: string, limit: number): Promise<AnalysisResult> {
    this.logger.log(`Iniciando análisis para: ${input}`);

    const isDirectUrl = input.startsWith('http');
    let rawPosts = [];
    let subredditName = input;

    if (isDirectUrl) {
      // 1.a Si es URL directa, traemos el único post
      const post = await this.redditService.fetchPostByUrl(input);
      rawPosts = post; // fetchPostByUrl devuelve un array con 1 elemento
      subredditName = post[0].data.subreddit; // extraemos el nombre real del subreddit
    } else {
      // 1.b Si es un nombre de subreddit, scrapeamos el /hot
      rawPosts = await this.redditService.fetchSubredditHot(input, limit);
    }

    // 2. Tomar los posts más relevantes para análisis con IA
    let postsToAnalyze = rawPosts.map((p: any) => p.data);
    
    // Si NO es URL directa, aplicamos los filtros de calidad
    if (!isDirectUrl) {
      postsToAnalyze = postsToAnalyze
        .filter((p: any) => p.selftext && p.selftext.length > 50)
        .filter((p: any) => p.num_comments >= 10)
        .slice(0, 2);
    }

    this.logger.log(`Enviando ${postsToAnalyze.length} posts al Narrative Auditor...`);

    // 3. Analizar cada post con el NarrativeAuditor (Ollama) secuencialmente
    // Evitamos Promise.all para no saturar la VRAM del modelo local con peticiones concurrentes
    const analysisResults: any[] = [];
    for (const post of postsToAnalyze) {
      try {
        const result = await this.auditorService.analyzeNarrative({
          communityName: subredditName,
          title: post.title,
          comments: post.selftext.slice(0, 1000), // máximo 1000 chars por post
        });
        
        analysisResults.push({
          title: post.title,
          score: result.frustrationScore,
          opportunity: result.businessOpportunity,
          mainPainPoint: result.mainPainPoint,
          sourceUrl: `https://reddit.com${post.permalink}`,
        });
      } catch (err) {
        this.logger.warn(`Falló análisis de post: ${post.title} — ${err.message}`);
      }
    }

    // 4. Construir los PainPoints para el NeedFeed
    const painPoints: PainPoint[] = analysisResults.map((r) => ({
      title: r.title,
      score: r.score,
      opportunity: r.opportunity,
      sourceUrl: r.sourceUrl,
      mainPainPoint: r.mainPainPoint,
    }));

    // 5. Generar clusters para el MarketMap
    const clusters = this.buildClusters(analysisResults, subredditName);

    const finalResult = {
      subreddit: subredditName,
      inputUrl: isDirectUrl ? input : `https://reddit.com/r/${subredditName}`,
      analyzedAt: new Date().toISOString(),
      totalPosts: rawPosts.length,
      painPoints,
      clusters,
    };

    // 6. Exportar reporte Markdown
    await this.exportToMarkdown(finalResult);

    return finalResult;
  }

  private async exportToMarkdown(result: any) {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      // Crear carpeta si no existe
      await fs.mkdir(reportsDir, { recursive: true });

      const safeName = result.subreddit.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `reporte-${safeName}-${Date.now()}.md`;
      const filePath = path.join(reportsDir, fileName);

      let mdContent = `# Insight Engine Report: r/${result.subreddit}\n`;
      mdContent += `**Date:** ${new Date(result.analyzedAt).toLocaleString()}\n`;
      mdContent += `**Source URL:** [Link](${result.inputUrl})\n`;
      mdContent += `**Total Posts Scraped:** ${result.totalPosts}\n\n`;
      mdContent += `## Market Pain Points\n\n`;

      result.painPoints.forEach((pp, idx) => {
        mdContent += `### ${idx + 1}. ${pp.title}\n`;
        mdContent += `- **Frustration Score:** ${pp.score}/10\n`;
        mdContent += `- **Main Pain Point:** ${pp.mainPainPoint}\n`;
        mdContent += `- **Business Opportunity:** ${pp.opportunity}\n`;
        mdContent += `- **Source:** [Reddit Post](${pp.sourceUrl})\n\n`;
      });

      await fs.writeFile(filePath, mdContent, 'utf-8');
      this.logger.log(`Reporte Markdown guardado en: ${filePath}`);
    } catch (err) {
      this.logger.error(`Error guardando reporte Markdown: ${err.message}`);
    }
  }

  /**
   * Construye nodos y links para D3.js agrupando pain points por nivel de frustración.
   * Alta frustración (>6) = grupo 1 (azul), Media = grupo 2 (verde), Baja = grupo 3 (gris)
   */
  private buildClusters(
    results: any[],
    subreddit: string,
  ): { nodes: ClusterNode[]; links: ClusterLink[] } {
    const nodes: ClusterNode[] = [];
    const links: ClusterLink[] = [];

    // Nodo central: el subreddit mismo
    nodes.push({ id: 'center', name: `r/${subreddit}`, group: 0, radius: 28 });

    results.forEach((result, index) => {
      if (!result) return;
      const id = `node-${index}`;
      const group = result.score >= 7 ? 1 : result.score >= 4 ? 2 : 3;
      const radius = 8 + result.score * 1.5; // radio proporcional a la frustración

      // Truncar el título para el label del nodo
      const label = result.mainPainPoint?.slice(0, 30) || result.title.slice(0, 30);

      nodes.push({ id, name: label, group, radius });
      links.push({ source: 'center', target: id, value: Math.ceil(result.score / 3) });
    });

    return { nodes, links };
  }
}
