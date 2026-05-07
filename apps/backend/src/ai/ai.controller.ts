import { Controller, Post, Body } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import pLimit from 'p-limit';
import { MAX_CONCURRENT_INFERENCES } from './ai.constants';

// 4️⃣ Inicializa la función limitadora pasándole tu constante
const limitInference = pLimit(MAX_CONCURRENT_INFERENCES);

@Controller('ai')
export class AiController {
  constructor(
    // 1️⃣ Inyecta el servicio de embeddings
    private readonly embeddingsService: EmbeddingsService, // ¿De qué clase estamos hablando?
  ) { }

  // 2️⃣ Define que este método responderá a peticiones HTTP POST en la ruta /ai/embed
  @Post('embed') // Pista: Usamos un decorador que importamos arriba
  async testEmbedding(
    // 3️⃣ Extrae la propiedad "text" del cuerpo (body) de la petición HTTP
    @Body('text') text: string, // 4️⃣ ¿Qué tipo de dato es un texto? (Pista: el decorador está en la línea 1)
  ) {
    // 5️⃣ Llama al método de tu servicio que genera el arreglo de números
    const vector = await limitInference(
      () => this.embeddingsService.generateEmbedding(text)
    );

    return {
      message: 'Embedding generado con éxito',
      dimensions: vector.length, // Nomic suele dar 768 dimensiones
      vector: vector, // Esto va a imprimir toooodos los números
    };
  }
}
