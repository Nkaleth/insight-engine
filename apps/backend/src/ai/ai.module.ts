import { Global, Module } from '@nestjs/common';
import { OllamaFactory } from './ollama.client';
import { EmbeddingsService } from './embeddings.service';
import { AiController } from './ai.controller';

@Global()
@Module({
  controllers: [AiController],
  providers: [OllamaFactory, EmbeddingsService],
  exports: [OllamaFactory, EmbeddingsService],
})
export class AiModule { }