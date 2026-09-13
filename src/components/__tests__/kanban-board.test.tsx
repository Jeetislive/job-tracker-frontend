import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/kanban-board';
import { Application, ApplicationStatus } from '@/types';

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'a1',
    company: 'Acme',
    title: 'Engineer',
    status: 'APPLIED' as ApplicationStatus,
    location: 'Remote',
    salaryMin: 100000,
    salaryMax: 150000,
    description: '',
    followUpDate: null,
    appliedDate: null,
    tags: [],
    source: null,
    priority: null,
    currency: null,
    archived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    _count: { notes: 0, documents: 0 },
    ...overrides,
  };
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('KanbanBoard', () => {
  it('renders one column per stage with the correct count', () => {
    const apps: Application[] = [
      makeApp({ id: '1', status: 'SAVED', company: 'A' }),
      makeApp({ id: '2', status: 'SAVED', company: 'B' }),
      makeApp({ id: '3', status: 'APPLIED', company: 'C' }),
    ];
    render(
      <Wrapper>
        <KanbanBoard
          applications={apps}
          onStatusChange={() => {}}
          onDelete={() => {}}
          onUpdated={() => {}}
        />
      </Wrapper>,
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('Offer')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();

    // Each column shows its count
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders company + title on each card', () => {
    const apps: Application[] = [
      makeApp({ id: '1', status: 'APPLIED', company: 'Verdant', title: 'Backend Engineer' }),
    ];
    render(
      <Wrapper>
        <KanbanBoard
          applications={apps}
          onStatusChange={() => {}}
          onDelete={() => {}}
          onUpdated={() => {}}
        />
      </Wrapper>,
    );
    expect(screen.getByText('Verdant')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
  });
});