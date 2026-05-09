"use client";

import { Zap, PlayCircle, MessageSquare } from "lucide-react";
import { PainPoint } from "../hooks/useAnalysis";

interface NeedFeedProps {
  painPoints?: PainPoint[];
  isLoading?: boolean;
  sourceLabel?: "reddit" | "youtube";
}

export default function NeedFeed({
  painPoints = [],
  isLoading = false,
  sourceLabel = "reddit",
}: NeedFeedProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center bg-gray-800/50 rounded-xl border border-gray-700 animate-pulse">
        <p className="text-blue-400">Analizando el mercado con IA... Esto puede tardar unos segundos.</p>
      </div>
    );
  }

  if (painPoints.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-800/30 rounded-xl border border-gray-700">
        <p className="text-gray-500">
          Esperando análisis. Los puntos de dolor aparecerán aquí.
        </p>
      </div>
    );
  }

  const isYoutube = sourceLabel === "youtube";
  const SourceIcon = isYoutube ? PlayCircle : MessageSquare;
  const sourceLinkText = isYoutube ? "Ver video en YouTube" : "Ver post original en Reddit";
  const sourceLinkClass = isYoutube
    ? "text-red-500 hover:text-red-400"
    : "text-blue-500 hover:text-blue-400";

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Zap className="text-yellow-400" />
        Puntos de Dolor Detectados
      </h3>

      <div className="grid gap-4">
        {painPoints.map((point, index) => (
          <div
            key={index}
            className="p-5 bg-gray-800 border border-gray-700 rounded-xl hover:border-gray-500 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-lg text-gray-100">
                {point.mainPainPoint || "Problema detectado"}
              </h4>
              <span
                className={`px-2 py-1 text-xs font-bold rounded-full ${
                  point.score >= 7
                    ? "bg-red-900/50 text-red-400 border border-red-800"
                    : point.score >= 4
                    ? "bg-yellow-900/50 text-yellow-400 border border-yellow-800"
                    : "bg-blue-900/50 text-blue-400 border border-blue-800"
                }`}
              >
                Score: {point.score}/10
              </span>
            </div>

            <p className="text-gray-300 mb-4 italic">"{point.title}"</p>

            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
              <p className="text-sm text-green-400 font-medium mb-1">💡 Oportunidad de Negocio:</p>
              <p className="text-sm text-gray-400">{point.opportunity}</p>
            </div>

            <a
              href={point.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 mt-3 text-xs underline transition-colors ${sourceLinkClass}`}
            >
              <SourceIcon size={12} />
              {sourceLinkText}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

