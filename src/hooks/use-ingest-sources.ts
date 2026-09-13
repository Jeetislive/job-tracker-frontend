import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ExtractionTestResult,
  IngestSettings,
  IngestSourcesResponse,
  TelegramLinkResponse,
} from '@/types';

export const INGEST_KEY = ['ingest-sources'] as const;

export function useIngestSources() {
  return useQuery({
    queryKey: INGEST_KEY,
    queryFn: async () => {
      const { data } = await api.get<IngestSourcesResponse>('/ingest-sources');
      return data;
    },
    staleTime: 15_000,
  });
}

export function useUpdateIngestSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<
      IngestSettings,
      'saveEmailBody' | 'llmExtractionEnabled' | 'telegramNotifyEnabled' | 'emailIngestEnabled'
    >>) => api.patch<IngestSourcesResponse>('/ingest-sources', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: INGEST_KEY }),
  });
}

export function useLinkTelegram() {
  return useMutation({
    mutationFn: () => api.post<TelegramLinkResponse>('/ingest-sources/telegram/link').then((r) => r.data),
  });
}

export function useDisconnectSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ingest-sources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: INGEST_KEY }),
  });
}

export function useTestExtraction() {
  return useMutation({
    mutationFn: (sample: { from?: string; subject?: string; text: string }) =>
      api.post<ExtractionTestResult>('/ingest/test', sample).then((r) => r.data),
  });
}