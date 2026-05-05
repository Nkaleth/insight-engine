import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
// Ojo: verifica que la ruta de tu RedditService coincida
import { RedditService } from '../reddit/reddit.service';


// 1. Decorador que convierte esta clase en un Processor y la suscribe a la cola 'scrape-queue'
@Processor('scrape-queue')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  // 2. Inyección de dependencias: Traemos la "receta" de Reddit
  constructor(
    @Inject(forwardRef(() => RedditService))
    private readonly redditService: RedditService) {
    super();
  }

  // 3. Este método es el que se ejecuta automáticamente cuando llega un nuevo ticket a la cola
  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`¡Nuevo ticket recibido! Job ID: ${job.id}`);

    // Extraemos la información del trabajo. Asumimos que viene con { subreddit: 'startups', limit: 50 }
    const { subreddit } = job.data;

    try {
      this.logger.log(`Procesando scraping para: ${subreddit}`);

      // 4. Llamamos a la función real de scraping de nuestro servicio (ej. fetchTopPosts)
      const result = await this.redditService.fetchSubredditHot(subreddit);

      this.logger.log(`Scraping finalizado para ${subreddit}. Items: ${result?.length || 0}`);
      return result;
    } catch (error) {
      this.logger.error(`Error escrapeando ${subreddit}:`, error);
      // Lanzamos el error de nuevo para que BullMQ sepa que el Job falló y aplique reintentos
      throw error;
    }
  }
}