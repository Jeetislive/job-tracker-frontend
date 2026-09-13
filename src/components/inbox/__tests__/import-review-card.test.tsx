import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import { ImportReviewCard } from '@/components/inbox/import-review-card';
import type { InboxItem } from '@/types';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('sonner', () => {
  const callable = vi.fn((..._args: unknown[]) => '');
  return {
    toast: Object.assign(callable, {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    }),
  };
});

function makeItem(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: 'app-1',
    company: 'Acme Corp',
    title: 'Senior Engineer',
    source: 'email:naukri',
    sourceId: null,
    sourceMessageId: 'msg-1',
    importedAt: '2026-09-12T10:00:00Z',
    importStatus: 'pending',
    importConfidence: 0.92,
    importPayload: {
      _meta: { path: 'regex', platform: 'naukri' },
    },
    status: 'APPLIED' as InboxItem['status'],
    appliedDate: '2026-09-11T00:00:00Z',
    location: 'Bangalore',
    salaryMin: 15,
    salaryMax: 20,
    currency: 'INR',
    tags: [],
    url: null,
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
    _count: { notes: 0, documents: 0 },
    ...overrides,
  };
}

function renderWithProviders(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    qc,
    ...render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>),
  };
}

describe('ImportReviewCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as ReturnType<typeof vi.fn>).mockReset();
    (api.post as ReturnType<typeof vi.fn>).mockReset();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('renders company, title and confidence/engine chip', () => {
    renderWithProviders(<ImportReviewCard item={makeItem()} />);
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('92% (regex)')).toBeInTheDocument();
    expect(screen.getByText('Naukri')).toBeInTheDocument();
  });

  it('flags LLM extraction from the payload meta', () => {
    renderWithProviders(
      <ImportReviewCard
        item={makeItem({ importPayload: { _meta: { path: 'llm', platform: 'naukri' } } })}
      />,
    );
    expect(screen.getByText('92% (LLM)')).toBeInTheDocument();
  });

  it('confirms the import via POST /applications/:id/confirm', async () => {
    renderWithProviders(<ImportReviewCard item={makeItem()} />);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/applications/app-1/confirm'));
  });

  it('rejects the import with an undo toast', async () => {
    renderWithProviders(<ImportReviewCard item={makeItem()} />);
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/applications/app-1/reject'));
    expect(toast).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ action: expect.objectContaining({ label: 'Undo' }) }),
    );
  });

  it('shows rejected state and hides the reject button when requested', () => {
    renderWithProviders(<ImportReviewCard item={makeItem({ importStatus: 'rejected' })} showRejectedState />);
    expect(screen.getByText(/Rejected/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });
});