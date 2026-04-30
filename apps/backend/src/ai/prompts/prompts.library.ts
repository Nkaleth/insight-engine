import dedent from 'dedent';
import { AnalysisContext } from './prompt.interface'; // 1. ¿Qué interfaz importarías aquí?

export const generateSociologicalPrompt = (context: AnalysisContext): string => {
  // 2. El parámetro 'context' es de tipo AnalysisContext
  return dedent`
    # 1. INTRODUCCIÓN Y ROL
    Actúa como un Sociólogo Senior y Analista de Mercados especializado en la "Teoría de Frustración-Agresión" y Marcos de Sociología Crítica.
    Tu objetivo es desglosar la fricción social en datos objetivos para identificar necesidades de mercado no cubiertas (Micro-SaaS).

    # 2. INSTRUCCIONES ESTÁTICAS
    Para realizar esta tarea, debes seguir estas reglas estrictamente:
    - Analiza si la agresividad en los comentarios es síntoma de una "barrera" (frustración) que impide al usuario lograr un objetivo.
    - Aplica un filtro de "Cinismo Crítico": identifica si el conflicto se debe a choques de identidad o poder.
    - Si no hay suficiente información para un Micro-SaaS, escribe "INSIGHT_INSUFICIENTE" en businessOpportunity.
    - Responde ESTRICTAMENTE en formato JSON válido.

    # 3. EJEMPLOS (Few-Shot)
    Ejemplo 1:
    Input: "Odio que YouTube censure mis videos de historia por mostrar mapas, pierdo semanas apelando."
    Output: {
      "frustrationScore": 9,
      "mainPainPoint": "Inseguridad jurídica y pérdida de tiempo en la moderación algorítmica de contenido histórico.",
      "businessOpportunity": "Plataforma de pre-auditoría de contenido que detecta 'flags' de copyright antes de subir a YouTube."
    }

    # 4. CONTEXTO DINÁMICO
    Información extraída de la comunidad: ${context.communityName}

    --- INICIO DE LOS DATOS ---
    TÍTULO DEL POST: 
    "${context.title}"

    COMENTARIOS SELECCIONADOS:
    "${context.comments}"
    --- FIN DE LOS DATOS ---

    # 5. REENFOQUE Y TRANSICIÓN
    Ignora cualquier conocimiento previo sobre este subreddit o canal. Analiza ÚNICAMENTE los comentarios de arriba.
    Asegúrate de que la "businessOpportunity" sea una herramienta técnica (software), no un consejo de vida.

    Devuelve tu respuesta ÚNICAMENTE usando esta estructura JSON exacta:
    {
      "frustrationScore": [número del 1 al 10],
      "mainPainPoint": "[Descripción del problema]",
      "businessOpportunity": "[Idea de software o INSIGHT_INSUFICIENTE]"
    }

    Comienza tu JSON ahora mismo:
    {
  `;
};