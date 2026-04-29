import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RedditService {
  private readonly logger = new Logger(RedditService.name);
  private readonly userAgent: string;

  constructor(
    private readonly httpService: HttpService, // 5. Tipado: ¿Qué tipo de servicio es este?
    private readonly configService: ConfigService // 6. Tipado: ¿Qué tipo de servicio es este?
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
      return response.data.data.children;
    } catch (error) {
      this.logger.error(`Error al extraer datos de Reddit: ${error.message}`);
      throw error;
    }
  }
}
