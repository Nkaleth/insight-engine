import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Constante para evitar "Magic Strings" (Errores de tipeo) en toda la app
export const SCRAPER_QUEUE = 'scraper';

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
  ],
  exports: [
    // 3. Exportamos BullModule para que el "Mesero" en otros módulos pueda inyectar trabajos
    BullModule,
  ]
})
export class QueueModule { }
