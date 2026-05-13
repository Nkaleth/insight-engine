import { Provider } from '@nestjs/common';
import OpenAI from 'openai';
import { LLAMACPP_CLIENT } from './ai.constants';
import { ConfigService } from '@nestjs/config';

export const LlamaCppFactory: Provider = {
  provide: LLAMACPP_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const baseURL = configService.get<string>('LLAMACPP_BASE_URL');
    if (!baseURL) {
      throw new Error('LLAMACPP_BASE_URL not defined in environment variables');
    }
    return new OpenAI({
      baseURL,
      apiKey: 'not-needed', // llama.cpp ignora la API key
    });
  },
};
