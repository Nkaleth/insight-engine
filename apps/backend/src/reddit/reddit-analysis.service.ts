import { Injectable, Logger } from '@nestjs/common';
import { RedditService } from './reddit.service';
import { NarrativeAuditorService } from '../ai/auditor.logic';
import { ReportsService } from '../youtube/reports.service';
import { VectorStoreService, StoredComment } from '../ai/vector-store.service';
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
  inputUrl: string;
  analyzedAt: string;
  totalPosts: number;
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

@Injectable()
export class RedditAnalysisService {
  private readonly logger = new Logger(RedditAnalysisService.name);

  constructor(
    private readonly redditService: RedditService,
    private readonly auditorService: NarrativeAuditorService,
    private readonly reportsService: ReportsService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  private async getPostsForAnalysis(
    input: string,
    limit: number,
  ): Promise<{
    representative: StoredComment[];
    subredditName: string;
    totalPosts: number;
    csvPath: string;
    csvReused: boolean;
    dbReused: boolean;
    isDirectUrl: boolean;
  }> {
    const isDirectUrl = input.startsWith('http');
    let subredditName = input;
    let posts: any[] = [];
    let csvPath = '';
    let csvReused = false;

    if (isDirectUrl) {
      const raw = await this.redditService.fetchPostByUrl(input);
      subredditName = raw[0]?.data?.subreddit || 'unknown';
      posts = raw.map((p: any) => p.data);
      
      // Guardar CSV también para URLs directas
      csvPath = await this.reportsService.writeRedditCsv(posts, subredditName);
      csvReused = false;

      await this.vectorStore.saveMany(
        posts.map((p) => ({ externalId: p.name || p.id, content: `${p.title}\n${p.selftext || ''}`, author: p.author, likeCount: p.score || p.ups })),
        input,
        'reddit',
      );
      const representative = await this.vectorStore.pickRepresentative(input, 15);
      return { representative, subredditName, totalPosts: posts.length, csvPath, csvReused, dbReused: false, isDirectUrl };
    }

    if (await this.vectorStore.hasEmbeddings(subredditName)) {
      this.logger.log(`✅ Capa 1 (DB): Vectores encontrados para r/${subredditName}`);
      const representative = await this.vectorStore.pickRepresentative(subredditName, 15);
      return { representative, subredditName, totalPosts: representative.length, csvPath: '', csvReused: false, dbReused: true, isDirectUrl };
    }

    const existingCsv = await this.reportsService.findExistingRedditCsv(subredditName);
    if (existingCsv) {
      this.logger.log(`✅ Capa 2 (CSV): Reutilizando ${existingCsv}`);
      posts = await this.reportsService.loadRedditPostsFromCsv(existingCsv);
      csvPath = existingCsv;
      csvReused = true;
    } else {
      this.logger.log(`📱 Capa 3 (API Reddit): Descargando posts de r/${subredditName}`);
      const rawPosts = await this.redditService.fetchSubredditHot(subredditName, limit);
      posts = rawPosts.map((p: any) => p.data);
      csvPath = await this.reportsService.writeRedditCsv(posts, subredditName);
      csvReused = false;
    }

    await this.vectorStore.saveMany(
      posts.map((p) => ({ externalId: p.name || p.id, content: `${p.title}\n${p.selftext || ''}`, author: p.author, likeCount: p.score || p.ups })),
      subredditName,
      'reddit',
    );

    const representative = await this.vectorStore.pickRepresentative(subredditName, 15);
    return { representative, subredditName, totalPosts: posts.length, csvPath, csvReused, dbReused: false, isDirectUrl };
  }

  async analyzeSubreddit(input: string, limit: number): Promise<AnalysisResult> {
    this.logger.log(`Iniciando análisis para: ${input}`);

    const { representative, subredditName, totalPosts, csvPath, csvReused, dbReused, isDirectUrl } = await this.getPostsForAnalysis(input, limit);

    this.logger.log(`Enviando ${representative.length} posts representativos (MMR) al Narrative Auditor...`);

    // Analizar con Ollama — secuencial para no saturar VRAM
    const analysisResults: any[] = [];
    for (const post of representative) {
      try {
        const result = await this.auditorService.analyzeNarrative({
          communityName: subredditName,
          title: `Post de ${post.author} (${post.likeCount} upvotes)`,
          comments: post.content.slice(0, 1000),
        });
        analysisResults.push({
          title: post.content.split('\n')[0].slice(0, 80),
          score: result.frustrationScore,
          opportunity: result.businessOpportunity,
          mainPainPoint: result.mainPainPoint,
          sourceUrl: isDirectUrl ? input : `https://reddit.com/r/${subredditName}`,
        });
      } catch (err) {
        this.logger.warn(`Falló análisis de post: ${err.message}`);
      }
    }

    const painPoints: PainPoint[] = analysisResults.map((r) => ({
      title: r.title,
      score: r.score,
      opportunity: r.opportunity,
      sourceUrl: r.sourceUrl,
      mainPainPoint: r.mainPainPoint,
    }));

    const clusters = this.buildClusters(analysisResults, subredditName);
    const analyzedAt = new Date().toISOString();
    const inputUrl = isDirectUrl ? input : `https://reddit.com/r/${subredditName}`;

    const reportPath = await this.exportToMarkdown({
      subreddit: subredditName,
      inputUrl,
      analyzedAt,
      totalPosts,
      csvPath,
      csvReused,
      dbReused,
      reportPath: '',
      painPoints,
      clusters,
    });

    return {
      subreddit: subredditName,
      inputUrl,
      analyzedAt,
      totalPosts,
      csvPath,
      csvReused,
      dbReused,
      reportPath,
      painPoints,
      clusters,
    };
  }

  private async exportToMarkdown(result: AnalysisResult): Promise<string> {
    try {
      const safeName = result.subreddit.replace(/[^a-zA-Z0-9]/g, '_');
      let md = `# Insight Engine Report: r/${result.subreddit}\n\n`;
      md += `**Date:** ${new Date(result.analyzedAt).toLocaleString('es-MX')}\n`;
      md += `**Source URL:** [Link](${result.inputUrl})\n`;
      md += `**Total Posts Scraped:** ${result.totalPosts}\n`;
      if (result.csvPath) {
        md += `**CSV:** \`${path.basename(result.csvPath)}\`${result.csvReused ? ' *(reutilizado)*' : ''}\n`;
      }
      md += `\n## Market Pain Points\n\n`;

      result.painPoints.forEach((pp, idx) => {
        const bar = '█'.repeat(pp.score) + '░'.repeat(10 - pp.score);
        md += `### ${idx + 1}. ${pp.title}\n`;
        md += `- **Frustration Score:** ${pp.score}/10 \`${bar}\`\n`;
        md += `- **Main Pain Point:** ${pp.mainPainPoint}\n`;
        md += `- **Business Opportunity:** ${pp.opportunity}\n`;
        md += `- **Source:** [Reddit Post](${pp.sourceUrl})\n\n`;
      });

      const fileName = `reporte-${safeName}-${Date.now()}.md`;
      return this.reportsService.writeMarkdown(md, 'pain-points', fileName);
    } catch (err) {
      this.logger.error(`Error guardando reporte Markdown: ${err.message}`);
      return '';
    }
  }

  private buildClusters(
    results: any[],
    subreddit: string,
  ): { nodes: ClusterNode[]; links: ClusterLink[] } {
    const nodes: ClusterNode[] = [];
    const links: ClusterLink[] = [];
    nodes.push({ id: 'center', name: `r/${subreddit}`, group: 0, radius: 28 });

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
