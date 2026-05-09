"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText, Lightbulb, Zap, Database, RefreshCw,
  ExternalLink, Eye, X, Trash2, AlertTriangle,
} from "lucide-react";
import {
  useReports, useDeleteReport, useDeleteCsv, ReportSummary,
  YoutubeAnalysisResult, YoutubeContentIdeasResult, PainPoint,
} from "../hooks/useAnalysis";
import { apiClient } from "../lib/api.client";
import NeedFeed from "./NeedFeed";
import ContentIdeasFeed from "./ContentIdeasFeed";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Parse .md into structured data ────────────────────────────────────────
function parsePainPointsMd(md: string): PainPoint[] {
  const painPoints: PainPoint[] = [];
  // Match each ### N. Title block
  const blocks = md.split(/\n(?=### \d+\.)/).slice(1);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const titleLine = lines[0].replace(/^### \d+\.\s*/, "").trim();
    const get = (label: string) => {
      const line = lines.find((l) => l.includes(`**${label}:**`));
      return line ? line.replace(/^.*\*\*[^*]+\*\*:?\s*/, "").trim() : "";
    };
    const scoreRaw = get("Frustration Score").replace(/\/10.*/, "").trim();
    painPoints.push({
      title: titleLine,
      score: parseInt(scoreRaw) || 0,
      mainPainPoint: get("Main Pain Point"),
      opportunity: get("Business Opportunity"),
      sourceUrl: get("Source").replace(/\[.*?\]\((.*?)\)/, "$1"),
    });
  }
  return painPoints;
}

function parseContentIdeasMd(md: string): Partial<YoutubeContentIdeasResult> {
  const get = (label: string) => {
    const match = md.match(new RegExp(`\\*\\*${label}\\*\\*\\s*\\n> ([^\\n]+)`));
    return match?.[1]?.trim() ?? "";
  };
  const audienceSentiment = get("Sentimiento General");
  const unmetNeed = get("Necesidad No Cubierta");

  const ideas: YoutubeContentIdeasResult["contentIdeas"] = [];
  const blocks = md.split(/\n(?=### \d+\.)/).slice(1);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const titleLine = lines[0].replace(/^### \d+\.\s*[""]?/, "").replace(/[""]?\s*$/, "").trim();
    const getField = (label: string) => {
      const line = lines.find((l) => l.includes(`**${label}:**`));
      return line ? line.replace(/^.*\*\*[^*]+\*\*:?\s*\*?/, "").replace(/\*$/, "").trim() : "";
    };
    const scoreRaw = getField("Opportunity Score").replace(/\/10.*/, "").trim();
    ideas.push({
      titleIdea: titleLine,
      format: getField("Formato"),
      hook: getField("Hook").replace(/^"|"$/g, ""),
      opportunityScore: parseInt(scoreRaw) || 6,
      demandEvidence: getField("Evidencia de Demanda"),
    });
  }
  return { audienceSentiment, unmetNeed, contentIdeas: ideas };
}

// ── Delete confirmation dialog ─────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  isLoading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-sm bg-gray-900 border border-red-800/50 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-900/30 rounded-xl">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h3 className="text-white font-bold text-lg">¿Confirmar borrado?</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {isLoading ? "Borrando..." : "Sí, borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Human-readable report modal ────────────────────────────────────────────
function ReportModal({
  report,
  onClose,
}: {
  report: ReportSummary;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch markdown text on mount
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

  // Parse once loaded
  let parsedPainPoints: PainPoint[] = [];
  let parsedIdeas: Partial<YoutubeContentIdeasResult> = {};
  if (content) {
    if (report.type === "pain-points") {
      parsedPainPoints = parsePainPointsMd(content);
    } else {
      parsedIdeas = parseContentIdeasMd(content);
    }
  }

  const sourceLabel = report.source === "reddit" ? "reddit" : "youtube";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText
              size={16}
              className={report.type === "pain-points" ? "text-orange-400" : "text-purple-400"}
            />
            <span className="text-sm font-semibold text-white font-mono truncate">
              {report.fileName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shrink-0 ml-3"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <p className="text-gray-400 animate-pulse text-center mt-12">Cargando reporte...</p>
          )}
          {error && (
            <p className="text-red-400 text-center mt-12">Error al cargar el reporte.</p>
          )}
          {content && report.type === "pain-points" && (
            <NeedFeed
              painPoints={parsedPainPoints}
              isLoading={false}
              sourceLabel={sourceLabel as "reddit" | "youtube"}
            />
          )}
          {content && report.type === "content-ideas" && (
            <ContentIdeasFeed
              data={parsedIdeas as YoutubeContentIdeasResult}
              isLoading={false}
            />
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
  onDeleteReport,
  onDeleteCsv,
}: {
  report: ReportSummary;
  onView: () => void;
  onDeleteReport: () => void;
  onDeleteCsv: () => void;
}) {
  const isPainPoints = report.type === "pain-points";
  const isReddit = report.source === "reddit";

  return (
    <div
      className={`group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.005] ${
        isPainPoints
          ? "bg-orange-950/20 border-orange-900/40 hover:border-orange-600/50"
          : "bg-purple-950/20 border-purple-900/40 hover:border-purple-600/50"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
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
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isReddit
              ? "bg-red-900/30 text-red-300"
              : "bg-blue-900/30 text-blue-300"
          }`}>
            {isReddit ? "Reddit" : "YouTube"}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono shrink-0">
          {formatDate(report.createdAt)}
        </span>
      </div>

      {/* ID / subreddit link */}
      <div>
        {isReddit ? (
          <a
            href={`https://reddit.com/r/${report.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-white font-mono hover:text-orange-400 transition-colors"
          >
            <code>r/{report.videoId}</code>
            <ExternalLink size={12} className="opacity-50" />
          </a>
        ) : (
          <a
            href={`https://www.youtube.com/watch?v=${report.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-white font-mono hover:text-red-400 transition-colors"
          >
            <code>{report.videoId}</code>
            <ExternalLink size={12} className="opacity-50" />
          </a>
        )}
      </div>

      {/* Files + actions */}
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

        <div className="ml-auto flex items-center gap-1.5">
          {/* View */}
          <button
            onClick={onView}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              isPainPoints
                ? "bg-orange-900/30 text-orange-300 hover:bg-orange-800/40"
                : "bg-purple-900/30 text-purple-300 hover:bg-purple-800/40"
            }`}
          >
            <Eye size={12} />
            Ver
          </button>
          {/* Delete CSV */}
          {report.csvFile && (
            <button
              onClick={onDeleteCsv}
              title="Eliminar CSV"
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              <Database size={11} />
              <Trash2 size={11} />
            </button>
          )}
          {/* Delete report */}
          <button
            onClick={onDeleteReport}
            title="Eliminar reporte"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-900/20 transition-colors"
          >
            <FileText size={11} />
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ReportsHistory() {
  const queryClient = useQueryClient();
  const { data: reports, isLoading, isError, refetch, isFetching } = useReports();
  const deleteReport = useDeleteReport();
  const deleteCsv = useDeleteCsv();

  const [activeReport, setActiveReport] = useState<ReportSummary | null>(null);
  const [confirm, setConfirm] = useState<{
    message: string;
    action: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      await confirm.action();
      queryClient.invalidateQueries({ queryKey: ["youtube-reports"] });
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const askDeleteReport = (report: ReportSummary) => {
    setConfirm({
      message: `¿Eliminar el reporte "${report.fileName}"? Esta acción no se puede deshacer.`,
      action: () =>
        deleteReport.mutateAsync({ type: report.type, fileName: report.fileName }),
    });
  };

  const askDeleteCsv = (report: ReportSummary) => {
    if (!report.csvFile) return;
    setConfirm({
      message: `¿Eliminar el CSV "${report.csvFile}"? Si lo borras, el próximo análisis requerirá llamar a la API nuevamente.`,
      action: () =>
        deleteCsv.mutateAsync({ source: report.source, csvFileName: report.csvFile! }),
    });
  };

  return (
    <section className="mt-4">
      {/* Modals */}
      {activeReport && (
        <ReportModal report={activeReport} onClose={() => setActiveReport(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          isLoading={confirmLoading}
        />
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
              onDeleteReport={() => askDeleteReport(report)}
              onDeleteCsv={() => askDeleteCsv(report)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
