"use client";

import { useState } from "react";
import { useLogin } from "../../hooks/useLogin";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isPending, isError, error } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Insight Engine</h1>
            <p className="text-gray-400 text-sm mt-1">Accede a tu plataforma de inteligencia de mercado</p>
          </div>

          {/* Error banner */}
          {isError && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-300 text-sm">
                {(error as Error)?.message || "Credenciales inválidas. Verifica tu email y contraseña."}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                           transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                           transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50
                         text-white font-semibold rounded-xl text-sm
                         transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                         flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-xs mt-8">
            Insight Engine · Plataforma de Análisis de Mercado con IA
          </p>
        </div>
      </div>
    </main>
  );
}
