"use client";

import { useState } from "react";
import NeedFeed from "../components/NeedFeed";
import MarketMap from "../components/MarketMap";
import { useRedditAnalysis } from "../hooks/useAnalysis";
import { Search, AlertCircle } from "lucide-react";

export default function Home() {
  const [subreddit, setSubreddit] = useState("");
  const { mutate, data, isPending, isError, error } = useRedditAnalysis();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subreddit.trim()) return;
    mutate(subreddit.trim());
  };

  return (
    <main className="min-h-screen bg-gray-900 p-8 md:p-24 flex justify-center">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Insight Engine <span className="text-blue-500">Radar</span>
          </h1>
          <p className="text-gray-400">
            Escuchando las necesidades del mercado en tiempo real.
          </p>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-medium">
              r/
            </span>
            <input
              type="text"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              placeholder="startups, solopreneur, SaaS..."
              className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !subreddit.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors"
          >
            {isPending ? "Analizando..." : <><Search size={18} /> Explorar</>}
          </button>
        </form>

        {isError && (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-xl flex items-center gap-3">
            <AlertCircle className="text-red-500" />
            <p className="text-red-200">{(error as Error)?.message || "Error al analizar el subreddit."}</p>
          </div>
        )}

        {/* Sección del Mapa de Clusters */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            🗺️ Mapa de Nichos (D3.js)
          </h2>
          <MarketMap nodes={data?.clusters?.nodes} links={data?.clusters?.links} />
        </section>

        <NeedFeed painPoints={data?.painPoints} isLoading={isPending} />
      </div>
    </main>
  );
}
