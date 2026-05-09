import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { YoutubeProvider } from './youtube.provider';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface YoutubeComment {
  id: string;
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  constructor(private readonly youtubeProvider: YoutubeProvider) {}

  /**
   * Extrae el videoId desde cualquier formato de URL de YouTube.
   * Soporta: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID
   */
  extractVideoId(url: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    throw new BadRequestException(
      `No se pudo extraer el videoId de la URL: "${url}". Asegúrate de que sea una URL válida de YouTube.`,
    );
  }

  /**
   * Extrae los comentarios de un video con paginación.
   * Por defecto trae hasta 200 comentarios (2 páginas de 100 c/u).
   */
  async fetchComments(
    videoId: string,
    maxComments: number = 200,
  ): Promise<YoutubeComment[]> {
    this.logger.log(
      `Iniciando scraping de comentarios para videoId: ${videoId} (máx: ${maxComments})`,
    );

    const allComments: YoutubeComment[] = [];
    let pageToken: string | undefined = undefined;
    const pageSize = Math.min(maxComments, 100); // La API soporta máx 100 por página

    while (allComments.length < maxComments) {
      const { comments: rawItems, nextPageToken } =
        await this.youtubeProvider.getVideoComments(
          videoId,
          pageSize,
          pageToken,
        );

      const mapped: YoutubeComment[] = rawItems.map((item: any) => {
        const snippet = item.snippet?.topLevelComment?.snippet ?? {};
        return {
          id: item.id ?? '',
          author: snippet.authorDisplayName ?? 'Anónimo',
          text: snippet.textDisplay ?? '',
          likeCount: snippet.likeCount ?? 0,
          publishedAt: snippet.publishedAt ?? new Date().toISOString(),
        };
      });

      allComments.push(...mapped);
      this.logger.log(
        `  → Página procesada: ${mapped.length} comentarios (total: ${allComments.length})`,
      );

      // Si no hay más páginas o ya alcanzamos el límite, paramos
      if (!nextPageToken || allComments.length >= maxComments) break;
      pageToken = nextPageToken;
    }

    // Garantizamos no sobrepasar el límite solicitado
    return allComments.slice(0, maxComments);
  }

  /**
   * Exporta un array de comentarios a un archivo CSV en /reports.
   * Formato: id, author, text (escapado), likeCount, publishedAt
   */
  async exportToCsv(
    comments: YoutubeComment[],
    videoId: string,
  ): Promise<string> {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      await fs.mkdir(reportsDir, { recursive: true });

      const fileName = `youtube-${videoId}-${Date.now()}.csv`;
      const filePath = path.join(reportsDir, fileName);

      // Cabecera CSV
      const header = 'id,author,text,likeCount,publishedAt\n';

      // Filas: escapamos comillas y saltos de línea en el texto del comentario
      const rows = comments
        .map((c) => {
          const escapedText = c.text
            .replace(/"/g, '""') // escapa comillas dobles
            .replace(/\n/g, ' '); // colapsa saltos de línea
          const escapedAuthor = c.author.replace(/"/g, '""');
          return `"${c.id}","${escapedAuthor}","${escapedText}",${c.likeCount},"${c.publishedAt}"`;
        })
        .join('\n');

      await fs.writeFile(filePath, header + rows, 'utf-8');
      this.logger.log(`✅ CSV exportado: ${filePath}`);
      return filePath;
    } catch (err) {
      this.logger.error(`Error exportando CSV: ${err.message}`);
      throw err;
    }
  }

  /** Obtiene el título de un video desde la API de YouTube. */
  async getVideoTitle(videoId: string): Promise<string> {
    return this.youtubeProvider.getVideoTitle(videoId);
  }
}
