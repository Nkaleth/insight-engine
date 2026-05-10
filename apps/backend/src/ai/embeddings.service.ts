import { Injectable, Logger, Inject } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OLLAMA_CLIENT } from './ai.constants';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    @Inject(OLLAMA_CLIENT)
    private readonly ollamaClient: Ollama,
  ) { }

  /** Convierte un texto a un vector de 768 dimensiones. */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.debug(`Vectorizando texto de ${text.length} caracteres...`);
      const response = await this.ollamaClient.embed({
        model: 'nomic-embed-text',
        input: text,
      });
      return response.embeddings[0];
    } catch (error) {
      this.logger.error('Error al generar embedding', error);
      throw error;
    }
  }

  /**
   * Convierte un batch de textos en vectores en UNA SOLA llamada a Ollama.
   * Más eficiente que llamar generateEmbedding N veces.
   * @param texts Array de strings (máx 50 por batch recomendado)
   */
  async generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
    try {
      this.logger.debug(`Vectorizando batch de ${texts.length} textos...`);
      const response = await this.ollamaClient.embed({
        model: 'nomic-embed-text',
        input: texts,
      });
      return response.embeddings;
    } catch (error) {
      this.logger.error(`Error al vectorizar batch de ${texts.length} textos`, error);
      throw error;
    }
  }
}
