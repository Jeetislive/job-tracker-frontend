import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Application,
  ApplicationDetail,
  ApplicationFilters,
  ApplicationSort,
  ApplicationStatus,
  Paginated,
  SortOrder,
  Stats,
} from '@/types';

const APPLICATIONS_KEY = ['applications'] as const;

export function useApplications(filters: ApplicationFilters = {}) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, filters],
    queryFn: async () => {
      const { data } = await api.get<Paginated<Application>>('/applications', {
        params: filters,
      });
      return data;
    },
  });
}

const PAGE_SIZE = 50;

export function useInfiniteApplications(filters: Omit<ApplicationFilters, 'page' | 'limit'> = {}) {
  return useInfiniteQuery({
    queryKey: [...APPLICATIONS_KEY, 'infinite', filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<Paginated<Application>>('/applications', {
        params: { ...filters, page: pageParam, limit: PAGE_SIZE },
      });
      return data;
    },
    getNextPageParam: (last) => (last.items.length < last.limit ? undefined : last.page + 1),
  });
}

export function useApplication(id: string | undefined | null) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const { data } = await api.get<ApplicationDetail>(`/applications/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get<Stats>('/applications/stats');
      return data;
    },
  });
}

type CreatePayload = Partial<Application> & { company: string; title: string };
type UpdatePayload = Partial<Application>;

function invalidateApps(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: APPLICATIONS_KEY });
  qc.invalidateQueries({ queryKey: ['stats'] });
}

export function useCreateApplication(opts?: UseMutationOptions<Application, unknown, CreatePayload>) {
  const qc = useQueryClient();
  return useMutation<Application, unknown, CreatePayload>({
    mutationFn: (data) => api.post<Application>('/applications', data).then((r) => r.data),
    ...opts,
    onSuccess: (res, vars, ctx, mutation) => {
      invalidateApps(qc);
      opts?.onSuccess?.(res, vars, ctx, mutation);
    },
  });
}

export function useUpdateApplication(opts?: UseMutationOptions<Application, unknown, { id: string; data: UpdatePayload }>) {
  const qc = useQueryClient();
  return useMutation<Application, unknown, { id: string; data: UpdatePayload }>({
    mutationFn: ({ id, data }) =>
      api.patch<Application>(`/applications/${id}`, data).then((r) => r.data),
    ...opts,
    onSuccess: (res, vars, ctx, mutation) => {
      invalidateApps(qc);
      qc.invalidateQueries({ queryKey: ['application', vars.id] });
      opts?.onSuccess?.(res, vars, ctx, mutation);
    },
  });
}

export function useUpdateStatus<TContext = unknown>(
  opts?: UseMutationOptions<Application, unknown, { id: string; status: ApplicationStatus }, TContext>,
) {
  const qc = useQueryClient();
  return useMutation<Application, unknown, { id: string; status: ApplicationStatus }, TContext>({
    mutationFn: ({ id, status }) =>
      api.patch<Application>(`/applications/${id}/status`, { status }).then((r) => r.data),
    ...opts,
    onSuccess: (res, vars, ctx, mutation) => {
      invalidateApps(qc);
      qc.invalidateQueries({ queryKey: ['application', vars.id] });
      opts?.onSuccess?.(res, vars, ctx, mutation);
    },
  });
}

export function useDeleteApplication(opts?: UseMutationOptions<void, unknown, string>) {
  const qc = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: (id) => api.delete(`/applications/${id}`).then(() => undefined),
    ...opts,
    onSuccess: (res, vars, ctx, mutation) => {
      invalidateApps(qc);
      qc.invalidateQueries({ queryKey: ['application', vars] });
      opts?.onSuccess?.(res, vars, ctx, mutation);
    },
  });
}

export function useArchiveApplication(opts?: UseMutationOptions<Application, unknown, { id: string; archive: boolean }>) {
  const qc = useQueryClient();
  return useMutation<Application, unknown, { id: string; archive: boolean }>({
    mutationFn: ({ id, archive }) =>
      api
        .patch<Application>(`/applications/${id}/${archive ? 'archive' : 'restore'}`)
        .then((r) => r.data),
    ...opts,
    onSuccess: (res, vars, ctx, mutation) => {
      invalidateApps(qc);
      qc.invalidateQueries({ queryKey: ['application', vars.id] });
      opts?.onSuccess?.(res, vars, ctx, mutation);
    },
  });
}

export function useBulkStatus<TContext = unknown>(
  opts?: UseMutationOptions<{ updated: Application[] }, unknown, { ids: string[]; status: ApplicationStatus }, TContext>,
) {
  const qc = useQueryClient();
  return useMutation<{ updated: Application[] }, unknown, { ids: string[]; status: ApplicationStatus }, TContext>({
    mutationFn: ({ ids, status }) =>
      api.post<{ updated: Application[] }>('/applications/bulk/status', { ids, status }).then((r) => r.data),
    ...opts,
    onSuccess: (res, vars, ctx, mutation) => {
      invalidateApps(qc);
      opts?.onSuccess?.(res, vars, ctx, mutation);
    },
  });
}

export function useBulkDelete() {
  const qc = useQueryClient();
  return useMutation<{ deleted: number; ids: string[] }, unknown, { ids: string[] }>({
    mutationFn: ({ ids }) =>
      api.post<{ deleted: number; ids: string[] }>('/applications/bulk/delete', { ids }).then((r) => r.data),
    onSuccess: () => invalidateApps(qc),
  });
}

// Notes
export function useCreateNote(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post(`/applications/${applicationId}/notes`, { content }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', applicationId] }),
  });
}

export function useUpdateNote(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      api.patch(`/applications/${applicationId}/notes/${noteId}`, { content }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', applicationId] }),
  });
}

export function useDeleteNote(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) =>
      api.delete(`/applications/${applicationId}/notes/${noteId}`).then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', applicationId] }),
  });
}

// Documents
export function useUploadDocument(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api
        .post(`/applications/${applicationId}/documents`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', applicationId] }),
  });
}

export function useDeleteDocument(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => api.delete(`/documents/${docId}`).then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', applicationId] }),
  });
}

// Re-export sort types so callers don't need a second import
export type { ApplicationSort, SortOrder };