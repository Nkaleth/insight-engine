import { Global, Module } from '@nestjs/common';
import { OllamaFactory } from './ollama.client';

@Global()
@Module({
  providers: [OllamaFactory],
  exports: [OllamaFactory],
})
export class AiModule { }