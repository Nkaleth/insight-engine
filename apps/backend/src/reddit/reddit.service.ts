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
      throw new InternalServerErrorException('Error conectando con Reddit.');
    }
  }
}
