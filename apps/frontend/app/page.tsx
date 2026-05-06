import NeedFeed from "../components/NeedFeed";
import MarketMap from "../components/MarketMap";

export default function Home() {
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

        {/* Sección del Mapa de Clusters */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            🗺️ Mapa de Nichos (D3.js)
          </h2>
          <MarketMap />
        </section>
        <NeedFeed />
      </div>
    </main>
  );
}
