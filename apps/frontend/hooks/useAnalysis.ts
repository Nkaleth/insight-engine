import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api.client';

export interface PainPoint {
  title: string;
  score: number;
  opportunity: string;
  sourceUrl: string;
  mainPainPoint?: string;
}

export interface ClusterNode {
  id: string;
  name: string;
  group: number;
  radius: number;
}

export interface ClusterLink {
  source: string;
  target: string;
  value: number;
}

export interface AnalysisResult {
  subreddit: string;
  analyzedAt: string;
  totalPosts: number;
  painPoints: PainPoint[];
  clusters: {
    nodes: ClusterNode[];
    links: ClusterLink[];
  };
}

// El TransformInterceptor del backend envuelve la respuesta en { statusCode, data }
interface BackendResponse<T> {
  statusCode: number;
  data: T;
}

export function useRedditAnalysis() {
  return useMutation({
    mutationFn: async (subreddit: string) => {
      const response = await apiClient.post<BackendResponse<AnalysisResult>>('/reddit/analyze', {
        subreddit,
        limit: 15 // Scrappeamos los 15 posts más hot
      });
      return response.data.data;
    },
  });
}
