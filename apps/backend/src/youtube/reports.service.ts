import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { YoutubeComment } from './youtube.service';

export interface ReportSummary {
  source: 'youtube' | 'reddit';
  videoId: string;         // For reddit: subreddit name
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
 *     comments/        ← CSVs de comentarios YouTube
 *     reddit-posts/    ← CSVs de posts Reddit
 *     pain-points/     ← Reportes .md de Pain Points (YouTube + Reddit)
 *     content-ideas/   ← Reportes .md de Content Ideas (YouTube)
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly base = path.join(process.cwd(), 'reports');

  get commentsDir() { return path.join(this.base, 'comments'); }
  get redditPostsDir() { return path.join(this.base, 'reddit-posts'); }
  get painPointsDir() { return path.join(this.base, 'pain-points'); }
  get contentIdeasDir() { return path.join(this.base, 'content-ideas'); }

  /** Crea todas las subcarpetas si no existen */
  async ensureDirs(): Promise<void> {
    await fs.mkdir(this.commentsDir, { recursive: true });
    await fs.mkdir(this.redditPostsDir, { recursive: true });
    await fs.mkdir(this.painPointsDir, { recursive: true });
    await fs.mkdir(this.contentIdeasDir, { recursive: true });
  }

  // ─── YouTube CSV ──────────────────────────────────────────────────────────

  /** Busca el CSV más reciente para un videoId. */
  async findExistingCsv(videoId: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.commentsDir);
      const matches = files
        .filter((f) => f.startsWith(`youtube-${videoId}-`) && f.endsWith('.csv'))
        .sort()
        .reverse();
      if (matches.length > 0) {
        const found = path.join(this.commentsDir, matches[0]);
        this.logger.log(`✅ CSV YouTube reutilizado: ${found}`);
        return found;
      }
    } catch { /* no dir yet */ }
    return null;
  }

  /** Carga comentarios YouTube desde un CSV guardado. */
  async loadCommentsFromCsv(csvPath: string): Promise<YoutubeComment[]> {
    const raw = await fs.readFile(csvPath, 'utf-8');
    const lines = raw.split('\n').slice(1).filter(Boolean);
    return lines.map((line) => {
      const cols = line.match(/("(?:[^"]|"")*"|[^,]+)(?:,|$)/g) ?? [];
      const clean = (s: string) => s?.replace(/^"|"$/g, '').replace(/""/g, '"') ?? '';
      return {
        id: clean(cols[0] ?? ''),
        author: clean(cols[1] ?? ''),
        text: clean(cols[2] ?? ''),
        likeCount: parseInt(clean(cols[3] ?? ''), 10) || 0,
        publishedAt: clean(cols[4] ?? ''),
      };
    });
  }

  /** Escribe comentarios YouTube a CSV. */
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
    this.logger.log(`✅ CSV YouTube guardado: ${filePath}`);
    return filePath;
  }

  // ─── Reddit CSV ───────────────────────────────────────────────────────────

  /** Busca el CSV más reciente para un subreddit. */
  async findExistingRedditCsv(subreddit: string): Promise<string | null> {
    try {
      const safe = subreddit.replace(/[^a-zA-Z0-9]/g, '_');
      const files = await fs.readdir(this.redditPostsDir);
      const matches = files
        .filter((f) => f.startsWith(`reddit-${safe}-`) && f.endsWith('.csv'))
        .sort()
        .reverse();
      if (matches.length > 0) {
        const found = path.join(this.redditPostsDir, matches[0]);
        this.logger.log(`✅ CSV Reddit reutilizado: ${found}`);
        return found;
      }
    } catch { /* no dir yet */ }
    return null;
  }

  /**
   * Escribe los posts de Reddit a CSV.
   * Columnas: title, selftext, score, num_comments, permalink, subreddit
   */
  async writeRedditCsv(posts: any[], subreddit: string): Promise<string> {
    await this.ensureDirs();
    const safe = subreddit.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `reddit-${safe}-${Date.now()}.csv`;
    const filePath = path.join(this.redditPostsDir, fileName);
    const header = 'title,selftext,score,num_comments,permalink,subreddit\n';
    const rows = posts
      .map((p) => {
        const esc = (s: string) => `"${(s ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        return [
          esc(p.title),
          esc(p.selftext?.slice(0, 2000) ?? ''),
          p.score ?? 0,
          p.num_comments ?? 0,
          esc(`https://reddit.com${p.permalink}`),
          esc(p.subreddit),
        ].join(',');
      })
      .join('\n');
    await fs.writeFile(filePath, header + rows, 'utf-8');
    this.logger.log(`✅ CSV Reddit guardado: ${filePath}`);
    return filePath;
  }

  /**
   * Carga posts Reddit desde un CSV guardado.
   * Devuelve objetos con la misma forma que usa analyzeSubreddit.
   */
  async loadRedditPostsFromCsv(csvPath: string): Promise<any[]> {
    const raw = await fs.readFile(csvPath, 'utf-8');
    const lines = raw.split('\n').slice(1).filter(Boolean);
    return lines.map((line) => {
      const cols = line.match(/("(?:[^"]|"")*"|[^,]+)(?:,|$)/g) ?? [];
      const clean = (s: string) => s?.replace(/^"|"$/g, '').replace(/""/g, '"') ?? '';
      return {
        title: clean(cols[0] ?? ''),
        selftext: clean(cols[1] ?? ''),
        score: parseInt(clean(cols[2] ?? ''), 10) || 0,
        num_comments: parseInt(clean(cols[3] ?? ''), 10) || 0,
        permalink: clean(cols[4] ?? '').replace('https://reddit.com', ''),
        subreddit: clean(cols[5] ?? ''),
      };
    });
  }

  // ─── Markdown ─────────────────────────────────────────────────────────────

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

  async readReport(type: 'pain-points' | 'content-ideas', fileName: string): Promise<string> {
    return fs.readFile(path.join(this.base, type, fileName), 'utf-8');
  }

  // ─── Listado ──────────────────────────────────────────────────────────────

  async listReports(): Promise<ReportSummary[]> {
    await this.ensureDirs();
    const results: ReportSummary[] = [];

    for (const type of ['pain-points', 'content-ideas'] as const) {
      const dir = path.join(this.base, type);
      try {
        const files = await fs.readdir(dir);
        for (const f of files.filter((x) => x.endsWith('.md'))) {
          const stats = await fs.stat(path.join(dir, f));

          // YouTube: youtube-{videoId}-{ts}.md
          const ytMatch = f.match(/^youtube-([a-zA-Z0-9_-]+)-(\d+)\.md$/);
          // Reddit: reporte-{subreddit}-{ts}.md
          const rdMatch = f.match(/^reporte-([a-zA-Z0-9_-]+)-(\d+)\.md$/);

          const isReddit = !!rdMatch;
          const key = ytMatch?.[1] ?? rdMatch?.[1] ?? 'unknown';
          const tsNum = ytMatch?.[2] ?? rdMatch?.[2];
          const ts = tsNum ? new Date(parseInt(tsNum)).toISOString() : stats.mtime.toISOString();

          // Buscar CSV relacionado
          let csvFile: string | null = null;
          try {
            const csvDir = isReddit ? this.redditPostsDir : this.commentsDir;
            const prefix = isReddit ? `reddit-${key}-` : `youtube-${key}-`;
            const csvFiles = await fs.readdir(csvDir);
            const found = csvFiles
              .filter((c) => c.startsWith(prefix) && c.endsWith('.csv'))
              .sort()
              .reverse()[0];
            if (found) csvFile = found;
          } catch { /* no CSV */ }

          results.push({
            source: isReddit ? 'reddit' : 'youtube',
            videoId: key,
            type,
            fileName: f,
            csvFile,
            createdAt: ts,
          });
        }
      } catch { /* empty dir */ }
    }

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // ─── Borrado ──────────────────────────────────────────────────────────────

  async deleteReport(type: 'pain-points' | 'content-ideas', fileName: string): Promise<void> {
    const filePath = path.join(this.base, type, fileName);
    await fs.unlink(filePath);
    this.logger.log(`🗑️ Reporte eliminado: ${filePath}`);
  }

  async deleteCsv(csvFileName: string, source: 'youtube' | 'reddit'): Promise<void> {
    const dir = source === 'reddit' ? this.redditPostsDir : this.commentsDir;
    const filePath = path.join(dir, csvFileName);
    await fs.unlink(filePath);
    this.logger.log(`🗑️ CSV eliminado: ${filePath}`);
  }
}
