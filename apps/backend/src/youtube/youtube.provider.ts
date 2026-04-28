import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, youtube_v3 } from 'googleapis';

@Injectable()
export class YoutubeProvider {
  private readonly youtubeClient: youtube_v3.Youtube;

  constructor(private readonly configService: ConfigService) {
    this.youtubeClient = google.youtube({
      version: 'v3',
      auth: this.configService.get<string>('YOUTUBE_API_KEY'),
    });
  }

  async searchVideos(query: string, maxResults: number = 10) {
    try {
      const response = await this.youtubeClient.search.list({ // ⬅️ LLENA EL HUECO 1: ¿Qué método de la API hace listas/búsquedas?
        part: ['snippet'],
        q: query,
        maxResults,
        type: ['video'],
        order: 'relevance',
      });

      return response.data.items || [];
    } catch (error) {
      // ⬅️ LLENA EL HUECO 2: ¿Qué clase de error nativo de NestJS deberíamos lanzar aquí si algo falla? (Pista: HTTPException o BadGatewayException)
      throw new BadGatewayException(
        `Error al buscar en YouTube: ${(error as Error).message}`
      );
    }
  }

  async getVideoComments(videoId: string, maxResults: number = 100, pageToken?: string) {
    try {
      const response = await this.youtubeClient.commentThreads.list({ // ⬅️ LLENA EL HUECO 3: ¿Qué método lista los hilos de comentarios?
        part: ['snippet'],
        videoId: videoId,
        maxResults,
        pageToken, // Si existe, trae la siguiente página de comentarios
        textFormat: 'plainText',
      });

      return {
        comments: response.data.items || [],
        nextPageToken: response.data.nextPageToken, // Vital para la paginación asíncrona
      };
    } catch (error) {
      throw new BadGatewayException( // ⬅️ LLENA EL HUECO 4 (Usa el mismo del Hueco 2)
        `Error al extraer comentarios del video ${videoId}: ${(error as Error).message}`
      );
    }
  }
}

