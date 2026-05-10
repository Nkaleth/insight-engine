import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OllamaFactory } from './ollama.client';
import { EmbeddingsService } from './embeddings.service';
import { AiController } from './ai.controller';
import { NarrativeAuditorService } from './auditor.logic';
import { VectorStoreService } from './vector-store.service';
import { PrismaService } from '../common/prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    OllamaFactory,
    EmbeddingsService,
    NarrativeAuditorService,
    PrismaService,
    VectorStoreService,
  ],
  exports: [
    OllamaFactory,
    EmbeddingsService,
    NarrativeAuditorService,
    PrismaService,
    VectorStoreService,
  ],
})
export class AiModule {}