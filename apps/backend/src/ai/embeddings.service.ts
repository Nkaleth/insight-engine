import { Injectable, Logger, Inject } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OLLAMA_CLIENT } from './ai.constants';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    // 1️⃣ Inyecta el token correcto usando el decorador de NestJS
    @Inject(OLLAMA_CLIENT) // Pista: Usamos el token exportado en ai.constants.ts
    private readonly ollamaClient: Ollama, // 2️⃣ ¿Cuál es el tipo de esta variable según nuestra importación de arriba?
  ) { }

  /**
   * Transforma texto en coordenadas matemáticas
   */
  async generateEmbedding(text: string): Promise<number[]> { // 3️⃣ ¿Qué devuelve un embedding? (tipo de dato primitivo)
    try {
      this.logger.debug(`Vectorizando texto de ${text.length} caracteres...`);

      // 4️⃣ Llama al método de embed de la librería Ollama
      const response = await this.ollamaClient.embed({
        model: 'nomic-embed-text', // 5️⃣ Pon el modelo exacto que descargamos en la Fase 1
        input: text,
      });

      // 6️⃣ Retorna el arreglo de números que viene en la respuesta
      return response.embeddings[0]; // Pista: Revisa qué devuelve el SDK de Ollama
    } catch (error) {
      this.logger.error('Error al generar embedding', error);
      throw error;
    }
  }
}
