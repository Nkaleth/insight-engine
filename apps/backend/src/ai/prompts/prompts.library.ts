import dedent from 'dedent';
import { AnalysisContext, ContentAnalysisContext } from './prompt.interface'; // 1. ¿Qué interfaz importarías aquí?

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

export const generateContentOpportunityPrompt = (context: ContentAnalysisContext): string => {
  return dedent`
    # 1. ROL / PERSONA
    Actúa como un Estratega de Contenido Senior y Analista de Audiencias de YouTube con experiencia en identificar vacíos de contenido (content gaps) mediante el análisis cuantitativo de señales de demanda en comentarios.

    # 2. TAREA Y FUNCIÓN
    Tu tarea es analizar un bloque de comentarios de YouTube para identificar oportunidades de contenido que LA AUDIENCIA YA ESTÁ DEMANDANDO activamente. Cada idea debe estar directamente respaldada por evidencia en los comentarios.

    La función de este análisis es generar ideas de nuevos videos ÚNICAMENTE cuando hay señales claras de demanda: preguntas repetidas, frustración por falta de contenido, debates que piden resolución, o fascinación explícita hacia un subtema.

    # 3. SISTEMA DE PUNTUACIÓN: opportunityScore
    Para cada idea de contenido que identifiques, DEBES asignar un "opportunityScore" del 1 al 10 basado en señales cuantificables de demanda extraídas de los comentarios:

    - **8-10 (Alta demanda):** Múltiples comentarios hacen la misma pregunta, hay debates sin resolver, la audiencia pide explícitamente más contenido sobre ese tema.
    - **6-7 (Demanda moderada):** Al menos un comentario sustancial hace referencia al tema o hay una pregunta clara sin responder.
    - **1-5 (Demanda baja/especulativa):** La idea está vagamente relacionada pero no está explícitamente pedida.

    **REGLA CRÍTICA:** Incluye SOLO ideas con opportunityScore >= 6. Las ideas por debajo de ese umbral son especulación, no demanda real.

    # 4. CONTEXTO Y AUDIENCIA
    Estos comentarios pertenecen al video: "${context.videoTitle}".
    La audiencia ya está involucrada; nos interesa capturar su interés latente con evidencia, no inventar nichos.

    # 5. FORMATO Y ESTRUCTURA ESTRICTA
    Entregarás ESTRICTAMENTE un JSON válido con este esquema:
    {
      "audienceSentiment": "[Resumen de la emoción o vibra general en 1-2 líneas]",
      "unmetNeed": "[El vacío de contenido principal con mayor demanda observada]",
      "contentIdeas": [
        {
          "opportunityScore": [número entero del 6 al 10],
          "demandEvidence": "[Cita o parafraseo de 1-3 comentarios que justifican este score]",
          "videoIdea": "[Idea de video bien elaborada y sustentada analíticamente basada en la demanda, no solo un título. Desarrolla el concepto.]",
          "format": "Faceless video",
          "hook": "[Frase o imagen de gancho para los primeros 5 segundos]"
        }
      ]
    }

    Las ideas DEBEN estar ordenadas de mayor a menor opportunityScore.

    # 6. TONO Y ESTILO
    Analítico y orientado a producción creativa. Reporte de auditoría: directo, sin introducciones ni disclaimers morales.

    # 7. RESTRICCIONES
    - Analiza ÚNICAMENTE los comentarios proporcionados. No inventes demanda que no esté ahí.
    - Si no hay ideas con score >= 6, devuelve contentIdeas: [] y escribe "SIN_DEMANDA_SUFICIENTE" en unmetNeed.
    - NO uses bloques markdown (\`\`\`json). Devuelve solo el JSON.

    # 8. EJEMPLO
    Comentarios: "No entendí cómo sobrevivieron con tan poca energía", "¡Quiero saber más sobre los trajes térmicos!", "¿Qué pasó con la colonia norte?"

    Salida esperada:
    {
      "audienceSentiment": "Alta intriga por el worldbuilding, confusión sobre mecánicas de supervivencia.",
      "unmetNeed": "Falta explicación del lore tecnológico y resolución de la colonia norte.",
      "contentIdeas": [
        {
          "opportunityScore": 9,
          "demandEvidence": "Dos comentarios preguntan explícitamente sobre los trajes y la colonia norte.",
          "videoIdea": "Explorar en profundidad el funcionamiento técnico y los fallos letales de los trajes térmicos en condiciones extremas, vinculando su mal funcionamiento con el evento de extinción de la colonia norte.",
          "format": "Faceless video",
          "hook": "¿Qué pasaba dentro de los trajes cuando la energía se agotaba?"
        },
        {
          "opportunityScore": 7,
          "demandEvidence": "Un comentario pide resolución del conflicto de la colonia norte.",
          "videoIdea": "Un análisis narrativo paso a paso sobre los últimos días de la Colonia del Norte, detallando cómo la falla en la comunicación y escasez de recursos precipitó su caída.",
          "format": "Faceless video",
          "hook": "Mientras el protagonista huía, el núcleo de la colonia colapsaba."
        }
      ]
    }

    --- INICIO DE LOS DATOS ---
    TÍTULO DEL VIDEO:
    "${context.videoTitle}"

    COMENTARIOS SELECCIONADOS:
    "${context.comments}"
    --- FIN DE LOS DATOS ---

    Comienza tu JSON ahora mismo:
    {
  `;
};