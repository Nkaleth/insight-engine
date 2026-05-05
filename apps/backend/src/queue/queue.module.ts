import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScraperProcessor } from './scraper.processor';
import { RedditModule } from '../reddit/reddit.module';
import { SCRAPER_QUEUE } from './queue.constants';

@Module({
  imports: [
    // 1. Conexión principal a Redis (Asíncrona porque leemos del .env)
    BullModule.forRootAsync(({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    })),

    // 2. Registro de nuestra "Bandeja de Entrada" específica
    BullModule.registerQueue({ name: SCRAPER_QUEUE }),
    forwardRef(() => RedditModule),
  ],
  exports: [
    // 3. Exportamos BullModule para que el "Mesero" en otros módulos pueda inyectar trabajos
    BullModule,
  ],
  providers: [ScraperProcessor],
})
export class QueueModule { }
