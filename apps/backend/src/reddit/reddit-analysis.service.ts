import { Injectable, Logger } from '@nestjs/common';
import { RedditService } from './reddit.service';
import { NarrativeAuditorService } from '../ai/auditor.logic';

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

  async analyzeSubreddit(subreddit: string, limit: number): Promise<AnalysisResult> {
    this.logger.log(`Iniciando análisis completo de r/${subreddit} (${limit} posts)`);

    // 1. Scrapear los posts más calientes del subreddit
    const rawPosts = await this.redditService.fetchSubredditHot(subreddit, limit);

    // 2. Tomar los primeros 2 posts más relevantes para análisis con IA
    //    Filtramos: Solo posts con texto largo (>50 chars) y con al menos 10 comentarios.
    //    (Limitamos a 2 posts para la demo en vivo).
    const postsToAnalyze = rawPosts
      .map((p: any) => p.data)
      .filter((p: any) => p.selftext && p.selftext.length > 50)
      .filter((p: any) => p.num_comments >= 10) // <-- ¡Filtro de Calidad!
      .slice(0, 2);

    this.logger.log(`Enviando ${postsToAnalyze.length} posts al Narrative Auditor...`);

    // 3. Analizar cada post con el NarrativeAuditor (Ollama) secuencialmente
    // Evitamos Promise.all para no saturar la VRAM del modelo local con peticiones concurrentes
    const analysisResults: any[] = [];
    for (const post of postsToAnalyze) {
      try {
        const result = await this.auditorService.analyzeNarrative({
          communityName: subreddit,
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

    // 5. Generar clusters para el MarketMap agrupando por frustrationScore
    const clusters = this.buildClusters(analysisResults, subreddit);

    return {
      subreddit,
      analyzedAt: new Date().toISOString(),
      totalPosts: rawPosts.length,
      painPoints,
      clusters,
    };
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
