"use client";

import { useState } from "react";
import { Lightbulb, Film, Target, TrendingUp, Quote, Copy, Check } from "lucide-react";
import { YoutubeContentIdeasResult } from "../hooks/useAnalysis";

interface ContentIdeasFeedProps {
  data?: YoutubeContentIdeasResult;
  isLoading?: boolean;
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

export default function ContentIdeasFeed({ data, isLoading = false }: ContentIdeasFeedProps) {
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
