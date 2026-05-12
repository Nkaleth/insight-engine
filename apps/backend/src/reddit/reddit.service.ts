import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SCRAPER_QUEUE } from 'src/queue/queue.constants';

@Injectable()
export class RedditService {
  private readonly logger = new Logger(RedditService.name);
  private readonly userAgent: string;

  constructor(
    private readonly httpService: HttpService, // 5. Tipado: ¿Qué tipo de servicio es este?
    private readonly configService: ConfigService, // 6. Tipado: ¿Qué tipo de servicio es este?

    @InjectQueue(SCRAPER_QUEUE)
    private readonly scraperQueue: Queue,
  ) {
    this.userAgent = this.configService.getOrThrow<string>('REDDIT_USER_AGENT');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchSubredditHot(subreddit: string, limit: number = 10): Promise<any> {
    // 7. Inyecta la variable "limit" en la URL usando template literals (backticks)
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;

    this.logger.log(`Extrayendo datos de: ${url}`);

    try {
      const response = await firstValueFrom(
        // 8. ¿Qué método HTTP usamos para "leer" o pedir datos de una API?
        this.httpService.get(url, {
          headers: {
            // 9. Asigna la propiedad de la clase donde guardamos nuestra identificación
            'User-Agent': this.userAgent
          }
        })
      );

      // Axios devuelve la data en un objeto llamado "data", 
      // y Reddit anida su respuesta dentro de "data.children".
      const posts = response.data.data.children;

      await this.scraperQueue.add('analyze-reddit-data', {
        subreddit: subreddit,
        postsCount: posts.length,
        rawData: posts
      });

      return posts;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new NotFoundException(`El subreddit '${subreddit}' no existe o es privado. Recuerda que los subreddits no llevan espacios (ej: 'pazmental' en vez de 'paz mental').`);
      }
      this.logger.error(`Error al extraer datos de Reddit: ${error.message}`);
    }
  }

  async fetchPostByUrl(postUrl: string): Promise<any> {
    // Si la URL ya termina en .json, la usamos. Si no, se lo añadimos
    // Reddit suele añadir parámetros de tracking (?utm_source=...), así que mejor parseamos la URL.
    const urlObj = new URL(postUrl);
    urlObj.search = ''; // Limpiamos parámetros como ?context=3
    let cleanUrl = urlObj.toString();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    if (!cleanUrl.endsWith('.json')) {
      cleanUrl += '.json';
    }

    this.logger.log(`Extrayendo post directo de: ${cleanUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(cleanUrl, {
          headers: { 'User-Agent': this.userAgent }
        })
      );

      // [0] = El post original
      // [1] = Los comentarios
      const postNode = response.data[0]?.data?.children[0]?.data || {};
      const comments = response.data[1]?.data?.children
        .filter((c: any) => c.kind === 't1')
        .map((c: any) => ({
          data: {
            ...c.data,
            title: `Comentario de ${c.data.author}`,
            selftext: c.data.body,
            subreddit: postNode.subreddit || 'unknown',
            num_comments: 0,
          }
        })) || [];

      if (comments.length === 0) {
        // Fallback al post si no hay comentarios
        return response.data[0].data.children;
      }
      return comments;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new NotFoundException(`El post '${postUrl}' no fue encontrado.`);
      }
      this.logger.error(`Error al extraer post directo de Reddit: ${error.message}`);
      throw new InternalServerErrorException('Error conectando con Reddit.');
    }
  }

  async fetchTopicComments(topic: string, limit: number = 10): Promise<any[]> {
    const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(topic)}&limit=${limit}`;
    this.logger.log(`Buscando posts del topic: ${searchUrl}`);

    try {
      // 1. Obtener los posts del Topic
      const response = await firstValueFrom(
        this.httpService.get(searchUrl, {
          headers: { 'User-Agent': this.userAgent }
        })
      );

      const posts = response.data.data.children.map((c: any) => c.data);
      this.logger.log(`Encontrados ${posts.length} posts para el topic "${topic}". Extrayendo comentarios...`);

      let allComments: any[] = [];

      // 2. Iterar cada post y extraer sus comentarios (con delay de seguridad)
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        if (!post.permalink) continue;

        const postUrl = `https://www.reddit.com${post.permalink}`;
        try {
          const comments = await this.fetchPostByUrl(postUrl);
          // fetchPostByUrl devuelve los comentarios formateados o el post principal
          allComments = allComments.concat(comments);
        } catch (err) {
          this.logger.warn(`No se pudieron extraer comentarios del post ${postUrl}: ${err.message}`);
        }

        // Delay de 2000ms para evitar rate limiting de Reddit en búsquedas masivas
        if (i < posts.length - 1) {
          await this.sleep(2000);
        }
      }

      this.logger.log(`Total de comentarios extraídos para el topic "${topic}": ${allComments.length}`);
      return allComments;

    } catch (error) {
      this.logger.error(`Error al buscar topic en Reddit: ${error.message}`);
      throw new InternalServerErrorException('Error buscando el topic en Reddit.');
    }
  }
}
