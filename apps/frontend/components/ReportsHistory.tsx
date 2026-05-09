"use client";

import { useState } from "react";
import { FileText, Lightbulb, Zap, Database, RefreshCw, ExternalLink, Eye, X } from "lucide-react";
import { useReports, ReportSummary } from "../hooks/useAnalysis";
import { apiClient } from "../lib/api.client";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Markdown viewer modal ──────────────────────────────────────────────────
function MarkdownModal({
  report,
  onClose,
}: {
  report: ReportSummary;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch on mount
  useState(() => {
    apiClient
      .get<string>(`/youtube/reports/${report.type}/${report.fileName}`, {
        responseType: "text",
      })
      .then((r) => {
        setContent(typeof r.data === "string" ? r.data : JSON.stringify(r.data));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <FileText
              size={16}
              className={report.type === "pain-points" ? "text-orange-400" : "text-purple-400"}
            />
            <span className="text-sm font-semibold text-white font-mono">
              {report.fileName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <p className="text-gray-400 animate-pulse text-center mt-8">
              Cargando reporte...
            </p>
          )}
          {error && (
            <p className="text-red-400 text-center mt-8">
              Error al cargar el reporte.
            </p>
          )}
          {content && (
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report card ────────────────────────────────────────────────────────────
function ReportCard({
  report,
  onView,
}: {
  report: ReportSummary;
  onView: () => void;
}) {
  const isPainPoints = report.type === "pain-points";

  return (
    <div
      className={`group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${
        isPainPoints
          ? "bg-orange-950/20 border-orange-900/40 hover:border-orange-600/50"
          : "bg-purple-950/20 border-purple-900/40 hover:border-purple-600/50"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isPainPoints ? (
            <Zap size={16} className="text-orange-400 shrink-0" />
          ) : (
            <Lightbulb size={16} className="text-purple-400 shrink-0" />
          )}
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPainPoints
                ? "bg-orange-900/40 text-orange-300"
                : "bg-purple-900/40 text-purple-300"
            }`}
          >
            {isPainPoints ? "Pain Points" : "Content Ideas"}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono shrink-0">
          {formatDate(report.createdAt)}
        </span>
      </div>

      {/* Video ID link */}
      <div className="flex items-center gap-2">
        <a
          href={`https://www.youtube.com/watch?v=${report.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-white font-mono hover:text-red-400 transition-colors"
        >
          <code>{report.videoId}</code>
          <ExternalLink size={12} className="opacity-50" />
        </a>
      </div>

      {/* File badges + View button */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800/60 px-2.5 py-1 rounded-lg border border-gray-700/50">
          <FileText size={11} />
          {report.fileName}
        </span>
        {report.csvFile && (
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 px-2.5 py-1 rounded-lg border border-green-800/40">
            <Database size={11} />
            {report.csvFile}
          </span>
        )}
        <button
          onClick={onView}
          className={`ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            isPainPoints
              ? "bg-orange-900/30 text-orange-300 hover:bg-orange-800/40"
              : "bg-purple-900/30 text-purple-300 hover:bg-purple-800/40"
          }`}
        >
          <Eye size={12} />
          Ver reporte
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ReportsHistory() {
  const { data: reports, isLoading, isError, refetch, isFetching } = useReports();
  const [activeReport, setActiveReport] = useState<ReportSummary | null>(null);

  return (
    <section className="mt-4">
      {/* Modal */}
      {activeReport && (
        <MarkdownModal report={activeReport} onClose={() => setActiveReport(null)} />
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="text-gray-400" size={20} />
          Reportes Guardados
        </h2>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {isLoading && (
        <div className="p-6 text-center text-gray-500 animate-pulse">
          Cargando historial de reportes...
        </div>
      )}
      {isError && (
        <div className="p-4 text-center text-red-400 bg-red-900/10 rounded-xl border border-red-800/30">
          No se pudo cargar el historial. Asegúrate de que el backend esté activo.
        </div>
      )}
      {!isLoading && !isError && reports?.length === 0 && (
        <div className="p-8 text-center text-gray-600 bg-gray-800/20 rounded-xl border border-gray-700/30">
          Aún no hay reportes guardados. Ejecuta tu primer análisis.
        </div>
      )}
      {reports && reports.length > 0 && (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <ReportCard
              key={`${report.type}-${report.fileName}`}
              report={report}
              onView={() => setActiveReport(report)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
