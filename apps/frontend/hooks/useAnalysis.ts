import { useMutation, useQuery } from '@tanstack/react-query';
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

// ── YouTube ──────────────────────────────────────────────────────────────────

export interface YoutubeAnalysisResult {
  videoId: string;
  videoUrl: string;
  analyzedAt: string;
  totalComments: number;
  csvPath: string;
  csvReused: boolean;
  reportPath: string;
  painPoints: PainPoint[];
  clusters: {
    nodes: ClusterNode[];
    links: ClusterLink[];
  };
}

export function useYoutubeAnalysis() {
  return useMutation({
    mutationFn: async ({
      videoUrl,
      maxComments = 200,
    }: {
      videoUrl: string;
      maxComments?: number;
    }) => {
      const response = await apiClient.post<BackendResponse<YoutubeAnalysisResult>>(
        '/youtube/analyze',
        { videoUrl, maxComments },
      );
      return response.data.data;
    },
  });
}

// ── YouTube Content Ideas ──────────────────────────────────────────────────

export interface YoutubeContentIdeasResult {
  videoId: string;
  videoUrl: string;
  analyzedAt: string;
  totalComments: number;
  csvPath: string;
  csvReused: boolean;
  reportPath: string;
  audienceSentiment: string;
  unmetNeed: string;
  contentIdeas: {
    opportunityScore: number;
    demandEvidence: string;
    titleIdea: string;
    format: string;
    hook: string;
  }[];
}

export function useYoutubeContentIdeas() {
  return useMutation({
    mutationFn: async ({
      videoUrl,
      maxComments = 200,
    }: {
      videoUrl: string;
      maxComments?: number;
    }) => {
      const response = await apiClient.post<BackendResponse<YoutubeContentIdeasResult>>(
        '/youtube/content-ideas',
        { videoUrl, maxComments },
      );
      return response.data.data;
    },
  });
}

// ── Reports History ────────────────────────────────────────────────────────

export interface ReportSummary {
  videoId: string;
  type: 'pain-points' | 'content-ideas';
  fileName: string;
  csvFile: string | null;
  createdAt: string;
}

export function useReports() {
  return useQuery<ReportSummary[]>({
    queryKey: ['youtube-reports'],
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<ReportSummary[]>>('/youtube/reports');
      return response.data.data;
    },
    staleTime: 30_000, // refrescar cada 30s
  });
}
