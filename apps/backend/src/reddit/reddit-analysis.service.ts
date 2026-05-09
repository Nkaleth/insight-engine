import { Injectable, Logger } from '@nestjs/common';
import { RedditService } from './reddit.service';
import { NarrativeAuditorService } from '../ai/auditor.logic';
import { ReportsService } from '../youtube/reports.service';
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
  ) {}

  async analyzeSubreddit(input: string, limit: number): Promise<AnalysisResult> {
    this.logger.log(`Iniciando análisis para: ${input}`);

    const isDirectUrl = input.startsWith('http');
    let subredditName = input;
    let postsToAnalyze: any[] = [];
    let totalPosts = 0;
    let csvPath = '';
    let csvReused = false;

    if (isDirectUrl) {
      // URL directa — sin caché (única petición, no repetible)
      const raw = await this.redditService.fetchPostByUrl(input);
      subredditName = raw[0].data.subreddit;
      postsToAnalyze = raw.map((p: any) => p.data);
      totalPosts = postsToAnalyze.length;
    } else {
      // Subreddit — intentar reutilizar CSV primero
      const existingCsv = await this.reportsService.findExistingRedditCsv(subredditName);

      if (existingCsv) {
        postsToAnalyze = await this.reportsService.loadRedditPostsFromCsv(existingCsv);
        totalPosts = postsToAnalyze.length;
        csvPath = existingCsv;
        csvReused = true;
        this.logger.log(`CSV Reddit reutilizado (${totalPosts} posts)`);
      } else {
        const rawPosts = await this.redditService.fetchSubredditHot(subredditName, limit);
        const allData = rawPosts.map((p: any) => p.data);
        totalPosts = allData.length;

        // Guardar CSV con TODOS los posts
        csvPath = await this.reportsService.writeRedditCsv(allData, subredditName);

        // Aplicar filtros de calidad para el análisis IA
        postsToAnalyze = allData
          .filter((p: any) => p.selftext && p.selftext.length > 50)
          .filter((p: any) => p.num_comments >= 10)
          .slice(0, 2);
      }
    }

    // Filtros de calidad si venía del CSV (mantener coherencia)
    if (csvReused) {
      postsToAnalyze = postsToAnalyze
        .filter((p: any) => p.selftext && p.selftext.length > 50)
        .filter((p: any) => p.num_comments >= 10)
        .slice(0, 2);
    }

    this.logger.log(`Enviando ${postsToAnalyze.length} posts al Narrative Auditor...`);

    // Analizar con Ollama — secuencial para no saturar VRAM
    const analysisResults: any[] = [];
    for (const post of postsToAnalyze) {
      try {
        const result = await this.auditorService.analyzeNarrative({
          communityName: subredditName,
          title: post.title,
          comments: post.selftext.slice(0, 1000),
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
