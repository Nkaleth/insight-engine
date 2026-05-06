"use client"; // 1. Directiva obligatoria de Next.js para poder usar React Query y useState

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // 2. Usamos useState para instanciar el cliente una SOLA vez.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 3. Evitamos que se disparen peticiones locas si el usuario minimiza el navegador y vuelve
            refetchOnWindowFocus: false,
            // 4. ¿Cuánto tiempo vive la data en caché antes de considerarse "vieja"? (Ej: 1 minuto en milisegundos)
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
