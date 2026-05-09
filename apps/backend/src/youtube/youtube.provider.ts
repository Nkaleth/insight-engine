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
      const response = await this.youtubeClient.search.list({
        part: ['snippet'],
        q: query,
        maxResults,
        type: ['video'],
        order: 'relevance',
      });
      return response.data.items || [];
    } catch (error) {
      throw new BadGatewayException(
        `Error al buscar en YouTube: ${(error as Error).message}`
      );
    }
  }

  async getVideoComments(videoId: string, maxResults: number = 100, pageToken?: string) {
    try {
      const response = await this.youtubeClient.commentThreads.list({
        part: ['snippet'],
        videoId: videoId,
        maxResults,
        pageToken,
        textFormat: 'plainText',
      });
      return {
        comments: response.data.items || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      throw new BadGatewayException(
        `Error al extraer comentarios del video ${videoId}: ${(error as Error).message}`
      );
    }
  }

  /** Obtiene el título del video desde la API de YouTube */
  async getVideoTitle(videoId: string): Promise<string> {
    try {
      const response = await this.youtubeClient.videos.list({
        part: ['snippet'],
        id: [videoId],
      });
      return response.data.items?.[0]?.snippet?.title ?? videoId;
    } catch {
      return videoId; // fallback graceful al ID
    }
  }
}
