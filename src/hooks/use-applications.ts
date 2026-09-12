import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Application, ApplicationDetail, Stats, ApplicationStatus } from '@/types';

interface UseApplicationsArgs {
  search?: string;
  status?: ApplicationStatus;
}

export function useApplications(args: UseApplicationsArgs = {}) {
  return useQuery({
    queryKey: ['applications', args],
    queryFn: async () => {
      const { data } = await api.get<{ items: Application[]; total: number }>(
        '/applications',
        { params: args },
      );
      return data;
    },
  });
}

export function useApplication(id: string) {
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