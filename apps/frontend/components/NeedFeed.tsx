"use client";

import { useAnalyzeText } from "../hooks/useAnalysis";
import { AlertCircle, Activity, Zap } from "lucide-react";

export default function NeedFeed() {
  // 1. Instanciamos el hook que maneja la conexión
  const { mutate, data, isPending, isError } = useAnalyzeText();

  // 2. UI Defensiva: Estado de Carga
  if (isPending) {
    return (
      <div className="p-4 bg-gray-800 rounded-xl flex items-center gap-3 animate-pulse">
        <Activity className="text-blue-500" />
        <p className="text-gray-400">Analizando el mercado...</p>
      </div>
    );
  }

  // 3. UI Defensiva: Estado de Error
  if (isError) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded-xl flex items-center gap-3">
        <AlertCircle className="text-red-500" />
        <p className="text-red-200">Error al conectar con la IA.</p>
      </div>
    );
  }

  // 4. UI Defensiva: Estado Vacío (Aún no hay datos)
  if (!data) {
    return (
      <div className="p-6 border border-dashed border-gray-700 rounded-xl text-center">
        <p className="text-gray-500 mb-4">
          Ingresa texto para descubrir necesidades.
        </p>
        <button
          onClick={() =>
            mutate("La gente se queja mucho de que Notion es lento en móviles.")
          }
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Probar Análisis Falso
        </button>
      </div>
    );
  }

  // 5. Renderizado Exitoso
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <Zap className="text-yellow-400" />
        Puntos de Dolor Detectados
      </h3>

      {/* 6. Iteramos sobre los painPoints */}
      {data.painPoints.map((painPoint, index) => (
        <div
          key={index}
          className="p-4 bg-gray-800 border border-gray-700 rounded-xl"
        >
          <p className="text-gray-200">{painPoint}</p>
        </div>
      ))}
    </div>
  );
}
