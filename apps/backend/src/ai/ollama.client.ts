import { Provider } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OLLAMA_CLIENT } from './ai.constants';
import { ConfigService } from '@nestjs/config';

export const OllamaFactory: Provider = {
  provide: OLLAMA_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const host = configService.get<string>('OLLAMA_HOST');
    if (!host) {
      throw new Error('OLLAMA_HOST not defined in environment variables');
    }
    return new Ollama({ host });
  },
};