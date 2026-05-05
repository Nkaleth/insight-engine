import { Global, Module } from '@nestjs/common';
import { OllamaFactory } from './ollama.client';
import { EmbeddingsService } from './embeddings.service';
import { AiController } from './ai.controller';
import { NarrativeAuditorService } from './auditor.logic';

@Global()
@Module({
  controllers: [AiController],
  providers: [OllamaFactory, EmbeddingsService, NarrativeAuditorService],
  exports: [OllamaFactory, EmbeddingsService, NarrativeAuditorService],
})
export class AiModule { }