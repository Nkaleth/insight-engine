import { Injectable, Inject, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OLLAMA_CLIENT } from './ai.constants';
import { generateSociologicalPrompt, generateContentOpportunityPrompt } from './prompts/prompts.library';
import { AnalysisContext, ContentAnalysisContext } from './prompts/prompt.interface';

// 1. Interfaz que define el contrato de nuestro JSON esperado
export interface AuditorResult {
  frustrationScore: number;
  mainPainPoint: string;
  businessOpportunity: string;
}

export interface ContentAuditorResult {
  audienceSentiment: string;
  unmetNeed: string;
  contentIdeas: {
    opportunityScore: number;
    demandEvidence: string;
    titleIdea: string;
    format: string;
    hook: string;
  }[];
}

@Injectable()
export class NarrativeAuditorService {
  private readonly logger = new Logger(NarrativeAuditorService.name);

  constructor(
    // [HUECO 1]: Inyectamos nuestro motor Ollama usando el token constante correcto
    @Inject(OLLAMA_CLIENT) private readonly ollamaClient: Ollama,
  ) { }

  // [HUECO 2]: Define el tipo de dato de entrada y [HUECO 3] el tipo de dato de salida (promesa)
  async analyzeNarrative(context: AnalysisContext): Promise<AuditorResult> {
    this.logger.log(`Iniciando auditoría narrativa para la comunidad: ${context.communityName}`);

    // [HUECO 4]: Usa la función correcta de nuestra librería para armar el prompt final
    const prompt = generateSociologicalPrompt(context);

    try {
      // Llamada al LLM
      const response = await this.ollamaClient.chat({
        model: 'gemma4:e4b', // Usamos el modelo que tienes instalado
        messages: [{ role: 'user', content: prompt }],
        // [HUECO 5]: Forzamos a que Ollama nos devuelva ESTRICTAMENTE este formato
        format: 'json',
        options: {
          temperature: 0.2, // Baja creatividad, queremos hechos y análisis frío
        },
      });

      const rawText = response.message.content;

      // Pequeño truco defensivo: Nuestro prompt en prompts.library.ts terminaba en "{"
      // A veces la API de 'chat' ignora eso y manda un JSON completo, o a veces manda el resto del objeto.
      // Si la IA fue obediente, empezará directamente con "frustrationScore": ...
      const jsonString = rawText.trim().startsWith('{') ? rawText : '{' + rawText;

      // [HUECO 6]: Convierte el string de texto a un objeto JavaScript real
      const parsedResult: AuditorResult = JSON.parse(jsonString);

      this.logger.log('Análisis completado exitosamente.');
      return parsedResult;
    } catch (error) {
      this.logger.error(`Error durante la auditoría narrativa: ${error.message}`, error.stack);
      throw new Error('Fallo en el Narrative Auditor al procesar el texto.');
    }
  }

  async analyzeContentOpportunity(context: ContentAnalysisContext): Promise<ContentAuditorResult> {
    this.logger.log(`Iniciando análisis de ideas de contenido para: ${context.videoTitle}`);

    const prompt = generateContentOpportunityPrompt(context);

    try {
      const response = await this.ollamaClient.chat({
        model: 'gemma4:e4b',
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        options: {
          temperature: 0.4, // Un poco más de creatividad para idear contenido
        },
      });

      const rawText = response.message.content;
      const jsonString = rawText.trim().startsWith('{') ? rawText : '{' + rawText;

      const parsedResult: ContentAuditorResult = JSON.parse(jsonString);

      this.logger.log('Análisis de ideas de contenido completado exitosamente.');
      return parsedResult;
    } catch (error) {
      this.logger.error(`Error durante el análisis de contenido: ${error.message}`, error.stack);
      throw new Error('Fallo en el Narrative Auditor al procesar ideas de contenido.');
    }
  }
}
