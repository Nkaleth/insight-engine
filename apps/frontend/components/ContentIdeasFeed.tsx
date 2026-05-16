"use client";

import { useState } from "react";
import { Lightbulb, Film, Target, TrendingUp, Quote, Copy, Check, Sparkles } from "lucide-react";
import { YoutubeContentIdeasResult } from "../hooks/useAnalysis";

interface ContentIdeasFeedProps {
  data?: YoutubeContentIdeasResult;
  isLoading?: boolean;
  videoTitle?: string;
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 8 ? "bg-green-500" : score >= 6 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-xs font-bold font-mono w-8 text-right ${
          score >= 8
            ? "text-green-400"
            : score >= 6
            ? "text-yellow-400"
            : "text-red-400"
        }`}
      >
        {score}/10
      </span>
    </div>
  );
}

// ── Copy Button Component ──────────────────────────────────────────────────
function CopyBtn({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer ${className}`}
      title="Copiar contenido"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

// ── Viral Title Prompt Template ────────────────────────────────────────────
function buildViralTitlePrompt(videoTitle: string, videoIdea: string, audienceSentiment: string, unmetNeed: string): string {
  return `# 🎯 Plantilla Maestra: El Prompt Perfecto (Generador de Títulos Viral)

**Rol / Persona (Role):** 
Actúa como un Copywriter experto en YouTube y Estratega de Crecimiento especializado en Psicología del Click (CTR). Tu enfoque se basa en el análisis de "Video Outliers" (videos que rinden por encima del promedio) para extraer patrones de curiosidad y aplicarlos a nuevas ideas de contenido.

**Tarea y Función (Task & Function):** 
Tu tarea principal es generar 3 títulos definitivos para un video de YouTube, optimizados para pruebas A/B. Además, si el usuario te solicita posteriormente "3 títulos más" (o una cantidad específica), debes generar nuevas opciones inéditas aplicando exactamente las mismas reglas.
La función de estos títulos es maximizar la tasa de apertura mediante una "Jerarquía Visual" específica que facilite el escaneo rápido del usuario mientras navega en el feed.

**Tema y Enfoque (Topic & Focus):** 
El contenido debe tratar sobre la transformación de una idea base (Programa/Contenido) en una promesa irresistible basada en un formato de éxito comprobado (Video Outlier).
Debes enfocarte específicamente en la psicología de la "Brecha de Curiosidad" y en el cumplimiento estricto de la estructura visual de tres niveles.

**Contexto y Audiencia (Context & Audience):** 
Información de fondo: Los títulos en YouTube se cortan en dispositivos móviles a los 50-60 caracteres. El usuario promedio decide si hacer click en menos de un segundo.
La audiencia objetivo vendrá definida en el input de "Análisis de Audiencia". Utiliza esa información para adaptar el vocabulario, las "Power Words" y los disparadores emocionales para que resuenen específicamente con sus intereses y puntos de dolor. 

**Formato y Estructura (Output Format & Structure):** 
Entregarás el resultado en un bloque de texto claro con las opciones solicitadas.
Estructura la respuesta de esta manera:
1. [TÍTULO 1]
2. [TÍTULO 2]
3. [TÍTULO 3]

**Tono y Estilo (Tone & Style):** 
El tono debe ser directo, autoritario y emocionante.
El estilo de redacción debe ser minimalista pero cargado de palabras de alto impacto, eliminando cualquier palabra de relleno que no aporte valor al click.

**Restricciones y Límites (Constraints):** 
DEBES seguir las siguientes reglas estrictas en todo momento:
- **Idioma:** Si el "Título Original", la "Idea de Video" o el "Análisis de Audiencia" están en inglés, los títulos generados DEBEN estar en inglés. Adapta siempre tu respuesta al idioma de los inputs proporcionados.
- **Longitud:** Máximo 50 caracteres por título. Debes intentar acercarte lo más posible al límite de 50 para ocupar el espacio visual, pero NUNCA pasarte.
- **Jerarquía Visual (Los 3 Escalones):**
    - **1er Escalón (MAYÚSCULAS):** Solo para Palabras Importantes (verbos de acción, sustantivos clave, disparadores emocionales).
    - **2do Escalón (Mayúscula Inicial):** Para las Palabras Restantes (adjetivos descriptivos, nombres propios).
    - **3er Escalón (minúsculas):** Solo para Conectores (artículos, preposiciones, conjunciones: de, el, la, con, para, que, en, of, to, the, and, with, etc.).
- **Sin Emojis ni Añadidos:** No incluyas iconos, hashtags, ni explicaciones adicionales. Solo devuelve los títulos solicitados.
- **Persistencia de Reglas:** Si se te piden más títulos en la misma conversación, debes seguir aplicando el límite de caracteres, el idioma y la jerarquía visual sin excepciones.

**Ejemplos / Analogías (Provide Examples):** 
Para que te guíes, aquí tienes ejemplos de lo que considero un buen resultado:
- Entrada de ejemplo 1 (Español): Outlier "Cómo gané 1000$". Idea: "Vender cursos".
- Salida de ejemplo 1: GANA 1000$ Vendiendo Cursos de Forma RÁPIDA
- Entrada de ejemplo 2 (Inglés): Outlier "I quit my job to do this". Idea: "Start a youtube channel".
- Salida de ejemplo 2: I QUIT my Job to Start a YOUTUBE Channel

--------------------------------------------------------------------------------
[INPUTS]:
Título Original (Video Outlier): ${videoTitle}
Idea de Video (Programa): ${videoIdea}
Análisis de Audiencia:
Análisis de la Audiencia:
Sentimiento General: ${audienceSentiment}
Necesidad no cubierta: ${unmetNeed}

[OUTPUT]:`;
}

// ── Prompt Copy Button ─────────────────────────────────────────────────────
function PromptBtn({ videoTitle, videoIdea, audienceSentiment, unmetNeed }: {
  videoTitle: string; videoIdea: string; audienceSentiment: string; unmetNeed: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const prompt = buildViralTitlePrompt(videoTitle, videoIdea, audienceSentiment, unmetNeed);
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-900/30 text-amber-300 hover:bg-amber-800/40 transition-colors cursor-pointer border border-amber-800/50"
      title="Copiar prompt completo para generar títulos virales"
    >
      {copied ? (
        <><Check size={12} className="text-green-400" /> Copiado</>
      ) : (
        <><Sparkles size={12} /> Obtener Prompt</>
      )}
    </button>
  );
}

export default function ContentIdeasFeed({ data, isLoading = false, videoTitle = "" }: ContentIdeasFeedProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-gray-800/50 rounded-xl border border-gray-700 animate-pulse">
        <p className="text-purple-400">
          Analizando señales de demanda y generando ideas de contenido...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-gray-800/30 rounded-xl border border-gray-700">
        <p className="text-gray-500">
          Esperando análisis. Las ideas de contenido aparecerán aquí.
        </p>
      </div>
    );
  }

  const sortedIdeas = [...data.contentIdeas].sort(
    (a, b) => b.opportunityScore - a.opportunityScore
  );

  return (
    <div className="space-y-6">
      {/* Audience analysis panel */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 relative group">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="text-purple-400" />
            Análisis de la Audiencia
          </h3>
          <CopyBtn 
            text={`Análisis de la Audiencia:\nSentimiento General: ${data.audienceSentiment}\nNecesidad no cubierta: ${data.unmetNeed}`} 
            className="opacity-0 group-hover:opacity-100 transition-opacity" 
          />
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">
              Sentimiento General
            </p>
            <p className="text-gray-200">{data.audienceSentiment}</p>
          </div>
          <div>
            <p className="text-sm text-red-400 uppercase tracking-wider font-semibold mb-1">
              Necesidad no cubierta
            </p>
            <p className="text-gray-200">{data.unmetNeed}</p>
          </div>
        </div>
      </div>

      {/* Ideas */}
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Lightbulb className="text-yellow-400" />
          Ideas de Contenido{" "}
          <span className="text-sm font-normal text-gray-400">
            (ordenadas por demanda real)
          </span>
        </h3>

        {sortedIdeas.length === 0 ? (
          <div className="p-6 bg-gray-800/30 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-500 italic">
              No se detectó demanda suficiente (score ≥ 6) en los comentarios.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedIdeas.map((idea, index) => (
              <div
                key={index}
                className="p-5 bg-gray-800 border border-purple-900/50 rounded-xl hover:border-purple-500/50 transition-colors"
              >
                {/* Title + format badge + copy btn */}
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h4 className="font-bold text-lg text-white leading-tight">
                    &ldquo;{idea.videoIdea || idea.titleIdea}&rdquo;
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-900/40 text-purple-300 border border-purple-800">
                      {idea.format}
                    </span>
                    <CopyBtn text={idea.videoIdea || idea.titleIdea} />
                  </div>
                </div>

                {/* Obtener Prompt button */}
                <div className="mb-3">
                  <PromptBtn
                    videoTitle={videoTitle || data.videoTitle || ""}
                    videoIdea={idea.videoIdea || idea.titleIdea}
                    audienceSentiment={data.audienceSentiment}
                    unmetNeed={data.unmetNeed}
                  />
                </div>

                {/* Opportunity score bar */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={13} className="text-gray-400" />
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      Opportunity Score
                    </p>
                  </div>
                  <ScoreBar score={idea.opportunityScore} />
                </div>

                {/* Demand evidence */}
                {idea.demandEvidence && (
                  <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 mb-3">
                    <div className="flex items-start gap-2">
                      <Quote size={13} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-purple-400 font-semibold mb-1">
                          Evidencia de demanda en comentarios:
                        </p>
                        <p className="text-sm text-gray-300 italic">
                          {idea.demandEvidence}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hook */}
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="flex items-start gap-2">
                    <Film size={13} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-400 font-semibold mb-1">
                        Hook (primeros 5 seg):
                      </p>
                      <p className="text-sm text-gray-300 italic">
                        &ldquo;{idea.hook}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
