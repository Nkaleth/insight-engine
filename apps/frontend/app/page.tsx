"use client";

import { useState } from "react";
import NeedFeed from "../components/NeedFeed";
import MarketMap from "../components/MarketMap";
import ContentIdeasFeed from "../components/ContentIdeasFeed";
import ReportsHistory from "../components/ReportsHistory";
import { useRedditAnalysis, useYoutubeAnalysis, useYoutubeContentIdeas } from "../hooks/useAnalysis";
import { Search, AlertCircle, PlayCircle, MessageSquare, FileDown } from "lucide-react";

type ActiveTab = "reddit" | "youtube";
type YoutubeMode = "pain-points" | "content-ideas";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("reddit");

  // ── Reddit state ──────────────────────────────────────────────
  const [subreddit, setSubreddit] = useState("");
  const redditMutation = useRedditAnalysis();

  // ── YouTube state ─────────────────────────────────────────────
  const [videoUrl, setVideoUrl] = useState("");
  const [youtubeMode, setYoutubeMode] = useState<YoutubeMode>("pain-points");
  const youtubeMutation = useYoutubeAnalysis();
  const youtubeContentIdeasMutation = useYoutubeContentIdeas();

  // ── Unified result state ──────────────────────────────────────
  const [forceRefresh, setForceRefresh] = useState(false);
  const isReddit = activeTab === "reddit";
  const isYoutubePainPoints = !isReddit && youtubeMode === "pain-points";
  const isYoutubeContentIdeas = !isReddit && youtubeMode === "content-ideas";

  const activeData = isReddit ? redditMutation.data : (isYoutubePainPoints ? youtubeMutation.data : youtubeContentIdeasMutation.data);
  const isPending = isReddit ? redditMutation.isPending : (isYoutubePainPoints ? youtubeMutation.isPending : youtubeContentIdeasMutation.isPending);
  const isError = isReddit ? redditMutation.isError : (isYoutubePainPoints ? youtubeMutation.isError : youtubeContentIdeasMutation.isError);
  const activeError = isReddit ? redditMutation.error : (isYoutubePainPoints ? youtubeMutation.error : youtubeContentIdeasMutation.error);

  const handleRedditSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subreddit.trim()) return;
    
    if (forceRefresh) {
      const confirmed = window.confirm("⚠️ ¿Estás seguro de forzar la re-extracción?\n\nEsto borrará permanentemente los datos antiguos (Vectores y CSV) de la base de datos y hará nuevas peticiones a la API.");
      if (!confirmed) return;
    }

    redditMutation.mutate({ subreddit: subreddit.trim(), forceRefresh });
  };

  const handleYoutubeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    if (forceRefresh) {
      const confirmed = window.confirm("⚠️ ¿Estás seguro de forzar la re-extracción?\n\nEsto borrará permanentemente los datos antiguos (Vectores y CSV) de la base de datos y hará nuevas peticiones a la API.");
      if (!confirmed) return;
    }

    if (youtubeMode === "pain-points") {
      youtubeMutation.mutate({ videoUrl: videoUrl.trim(), forceRefresh });
    } else {
      youtubeContentIdeasMutation.mutate({ videoUrl: videoUrl.trim(), forceRefresh });
    }
  };

  const ytData = !isReddit ? (isYoutubePainPoints ? youtubeMutation.data : youtubeContentIdeasMutation.data) : null;

  return (
    <main className="min-h-screen bg-gray-900 p-8 md:p-24 flex justify-center">
      <div className="w-full max-w-3xl flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Insight Engine <span className="text-blue-500">Radar</span>
          </h1>
          <p className="text-gray-400">
            Escuchando las necesidades del mercado en tiempo real.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 bg-gray-800 rounded-xl border border-gray-700">
          <button
            id="tab-reddit"
            onClick={() => setActiveTab("reddit")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isReddit
                ? "bg-orange-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageSquare size={16} />
            Reddit
          </button>
          <button
            id="tab-youtube"
            onClick={() => setActiveTab("youtube")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
              !isReddit
                ? "bg-red-600 text-white shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <PlayCircle size={16} />
            YouTube
          </button>
        </div>

        {/* ── Reddit Form ── */}
        {isReddit && (
          <form onSubmit={handleRedditSearch} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-medium">
                  r/
                </span>
                <input
                  id="reddit-input"
                  type="text"
                  value={subreddit}
                  onChange={(e) => setSubreddit(e.target.value)}
                  placeholder="startups, solopreneur, SaaS..."
                  className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isPending}
                />
              </div>
              <button
                id="reddit-submit"
                type="submit"
                disabled={isPending || !subreddit.trim()}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors"
              >
                {isPending ? "Analizando..." : <><Search size={18} /> Explorar</>}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 pl-1">
              <input
                type="checkbox"
                id="forceRefreshReddit"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-orange-600 focus:ring-orange-600 bg-gray-700"
              />
              <label htmlFor="forceRefreshReddit" className="text-sm text-gray-400 select-none cursor-pointer">
                Forzar extracción desde cero (borra caché existente)
              </label>
            </div>
          </form>
        )}

        {/* ── YouTube Form ── */}
        {!isReddit && (
          <form onSubmit={handleYoutubeSearch} className="flex flex-col gap-3">
            {/* Mode Toggle */}
            <div className="flex bg-gray-800 p-1 rounded-lg w-max mb-2 border border-gray-700">
              <button
                type="button"
                onClick={() => setYoutubeMode("pain-points")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${youtubeMode === "pain-points" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Radar de Pain Points
              </button>
              <button
                type="button"
                onClick={() => setYoutubeMode("content-ideas")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${youtubeMode === "content-ideas" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                Radar de Contenido
              </button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-red-500">
                  <PlayCircle size={18} />
                </span>
                <input
                  id="youtube-url-input"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isPending}
                />
              </div>
              <button
                id="youtube-submit"
                type="submit"
                disabled={isPending || !videoUrl.trim()}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors"
              >
                {isPending ? "Analizando..." : <><Search size={18} /> Analizar</>}
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="forceRefreshYt"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-red-600 focus:ring-red-600 bg-gray-700"
              />
              <label htmlFor="forceRefreshYt" className="text-sm text-gray-400 select-none cursor-pointer">
                Forzar extracción desde cero (borra caché existente)
              </label>
            </div>
          </form>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" />
            <p className="text-red-200">
              {(activeError as Error)?.message || "Error al procesar el análisis."}
            </p>
          </div>
        )}

        {/* ── YouTube CSV badge ── */}
        {ytData?.csvPath && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-700 rounded-xl">
            <FileDown size={16} className="text-green-400 shrink-0" />
            <p className="text-xs text-green-300">
              {(ytData as any).csvReused ? (
                <span className="font-semibold text-blue-300">CSV reutilizado (sin API):</span>
              ) : (
                <span className="font-semibold">CSV generado:</span>
              )}{" "}
              <code className="font-mono opacity-80">
                {ytData.csvPath.split("/").slice(-1)[0]}
              </code>
            </p>
            <span className="ml-auto text-xs text-green-500 font-mono">
              {ytData.totalComments} comentarios
            </span>
          </div>
        )}

        {/* ── MarketMap & NeedFeed (Pain Points) ── */}
        {(isReddit || isYoutubePainPoints) && (
          <>
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                🗺️ Mapa de Nichos (D3.js)
              </h2>
              <MarketMap
                nodes={(activeData as any)?.clusters?.nodes}
                links={(activeData as any)?.clusters?.links}
              />
            </section>

            <NeedFeed
              painPoints={(activeData as any)?.painPoints}
              isLoading={isPending}
              sourceLabel={isReddit ? "reddit" : "youtube"}
            />
          </>
        )}

        {/* ── Content Ideas Feed ── */}
        {isYoutubeContentIdeas && (
          <ContentIdeasFeed data={activeData as any} isLoading={isPending} />
        )}

        {/* ── Reports History ── */}
        <>
          <hr className="border-gray-700/50" />
          <ReportsHistory source={activeTab} />
        </>
      </div>
    </main>
  );
}
