import { Injectable, Inject, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LLAMACPP_CLIENT } from './ai.constants';
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
    videoIdea: string;
    format: string;
    hook: string;
  }[];
}

@Injectable()
export class NarrativeAuditorService {
  private readonly logger = new Logger(NarrativeAuditorService.name);

  constructor(
    // Inyectamos el cliente OpenAI apuntando a llama.cpp server
    @Inject(LLAMACPP_CLIENT) private readonly llm: OpenAI,
  ) { }

  // Define el tipo de dato de entrada y el tipo de dato de salida (promesa)
  async analyzeNarrative(context: AnalysisContext): Promise<AuditorResult> {
    this.logger.log(`Iniciando auditoría narrativa para la comunidad: ${context.communityName}`);

    const prompt = generateSociologicalPrompt(context);

    try {
      // Llamada al LLM via llama.cpp (OpenAI-compatible API)
      const response = await this.llm.chat.completions.create({
        model: 'qwen3.6-35b', // llama.cpp usa el modelo que tiene cargado; nombre descriptivo
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Baja creatividad, queremos hechos y análisis frío
      });

      const rawText = response.choices[0]?.message?.content ?? '';

      // Pequeño truco defensivo: a veces la respuesta no empieza con "{"
      const jsonString = rawText.trim().startsWith('{') ? rawText : '{' + rawText;

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
      const response = await this.llm.chat.completions.create({
        model: 'qwen3.6-35b', // llama.cpp usa el modelo que tiene cargado
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4, // Un poco más de creatividad para idear contenido
      });

      const rawText = response.choices[0]?.message?.content ?? '';
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
