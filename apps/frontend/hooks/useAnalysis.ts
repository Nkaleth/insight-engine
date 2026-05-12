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
    mutationFn: async ({ subreddit, forceRefresh = false }: { subreddit: string, forceRefresh?: boolean }) => {
      const response = await apiClient.post<BackendResponse<AnalysisResult>>('/reddit/analyze', {
        subreddit,
        limit: 50,
        forceRefresh
      });
      return response.data.data;
    },
  });
}

// ── YouTube ──────────────────────────────────────────────────────────────────

export interface YoutubeAnalysisResult {
  videoId: string;
  videoTitle: string;
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
      forceRefresh = false,
    }: {
      videoUrl: string;
      forceRefresh?: boolean;
    }) => {
      const response = await apiClient.post<BackendResponse<YoutubeAnalysisResult>>(
        '/youtube/analyze',
        { videoUrl, forceRefresh },
      );
      return response.data.data;
    },
  });
}

// ── YouTube Content Ideas ──────────────────────────────────────────────────

export interface YoutubeContentIdeasResult {
  videoId: string;
  videoTitle: string;
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
      forceRefresh = false,
    }: {
      videoUrl: string;
      forceRefresh?: boolean;
    }) => {
      const response = await apiClient.post<BackendResponse<YoutubeContentIdeasResult>>(
        '/youtube/content-ideas',
        { videoUrl, forceRefresh },
      );
      return response.data.data;
    },
  });
}

// ── Reports History ────────────────────────────────────────────────────────

export interface ReportSummary {
  source: 'youtube' | 'reddit';
  videoId: string;
  videoTitle: string;
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
    staleTime: 30_000,
  });
}

export function useDeleteReport() {
  return useMutation({
    mutationFn: async ({ type, fileName }: { type: 'pain-points' | 'content-ideas'; fileName: string }) => {
      await apiClient.delete(`/youtube/reports/${type}/${fileName}`);
    },
  });
}

export function useDeleteCsv() {
  return useMutation({
    mutationFn: async ({ source, csvFileName }: { source: 'youtube' | 'reddit'; csvFileName: string }) => {
      await apiClient.delete(`/youtube/reports/csv/${source}/${csvFileName}`);
    },
  });
}

