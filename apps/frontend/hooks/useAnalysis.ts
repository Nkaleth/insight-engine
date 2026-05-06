// 1. ¿Qué hook de TanStack Query usamos para peticiones POST/PUT/DELETE (es decir, alterar o procesar datos)?
import { useMutation } from '@tanstack/react-query';
// 2. Importamos nuestra instancia configurada de Axios
import { apiClient } from '../lib/api.client';

// 3. Tipamos la respuesta que esperamos de nuestro backend (Narrative Auditor)
interface AnalysisResponse {
  sentiment: string;
  painPoints: string[];
  marketOpportunities: string[];
}

export function useAnalyzeText() {
  // 4. Ejecutamos el hook de mutación
  return useMutation({
    // 5. mutationFn es la función que ejecuta el trabajo sucio
    mutationFn: async (textToAnalyze: string) => {
      // 6. Hacemos el POST usando nuestro cliente preconfigurado
      const response = await apiClient.post<AnalysisResponse>('/ai/analyze', {
        text: textToAnalyze
      });
      return response.data;
    },
  });
}
