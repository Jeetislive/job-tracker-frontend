import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApplications } from '@/hooks/use-applications';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe('useApplications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('passes search query to the API as ?search=', async () => {
    (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { items: [], total: 0, page: 1, limit: 50 },
    });

    const { result } = renderHook(() => useApplications({ search: 'Acme' }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      '/applications',
      expect.objectContaining({ params: expect.objectContaining({ search: 'Acme' }) }),
    );
  });

  it('reads total from the paginated response', async () => {
    (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { items: [{ id: '1' }], total: 7, page: 1, limit: 50 },
    });

    const { result } = renderHook(() => useApplications({}), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(7);
  });
});