'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  LogOut,
  Search,
  LayoutGrid,
  List as ListIcon,
  Download,
  Settings as SettingsIcon,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/use-auth';
import { useConfirm } from '@/hooks/use-confirm';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useApplications,
  useArchiveApplication,
  useBulkDelete,
  useBulkStatus,
  useDeleteApplication,
  useInfiniteApplications,
  useUpdateStatus,
} from '@/hooks/use-applications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KanbanBoard } from '@/components/kanban-board';
import { ApplicationFormDialog } from '@/components/application-form-dialog';
import { StatsBar } from '@/components/stats-bar';
import {
  Application,
  ApplicationSort,
  ApplicationStatus,
  SortOrder,
  STATUS_LABELS,
} from '@/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type StatusFilter = ApplicationStatus | 'all';
type SortKey = 'updatedAt-desc' | 'createdAt-desc' | 'followUpDate-asc' | 'company-asc';

const SORT_OPTIONS: Array<{ key: SortKey; label: string; sort: ApplicationSort; order: SortOrder }> = [
  { key: 'updatedAt-desc', label: 'Updated (newest)', sort: 'updatedAt', order: 'desc' },
  { key: 'createdAt-desc', label: 'Created (newest)', sort: 'createdAt', order: 'desc' },
  { key: 'followUpDate-asc', label: 'Follow-up date', sort: 'followUpDate', order: 'asc' },
  { key: 'company-asc', label: 'Company A–Z', sort: 'company', order: 'asc' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const confirm = useConfirm();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Local input state vs debounced query state (BUG-3)
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);

  // Filters (TASK-10)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt-desc');

  const [view, setView] = useState<'board' | 'list'>('board');
  const [createOpen, setCreateOpen] = useState(false);
  const [presetStatus, setPresetStatus] = useState<ApplicationStatus | undefined>();
  const [editing, setEditing] = useState<Application | null>(null);

  const selectedSort = SORT_OPTIONS.find((o) => o.key === sortKey)!;

  const tagsFilter = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      sort: selectedSort.sort,
      order: selectedSort.order,
      tags: tagsFilter.length > 0 ? tagsFilter : undefined,
      appliedFrom: appliedFrom ? `${appliedFrom}T00:00:00Z` : undefined,
      appliedTo: appliedTo ? `${appliedTo}T23:59:59Z` : undefined,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      archived: archivedOnly ? true : undefined,
      includeArchived: showArchived && !archivedOnly ? true : undefined,
    }),
    [
      search,
      statusFilter,
      selectedSort,
      tagsFilter,
      appliedFrom,
      appliedTo,
      salaryMin,
      salaryMax,
      archivedOnly,
      showArchived,
    ],
  );

  const { data, isLoading, refetch } = useApplications(filters);
  const apps: Application[] = data?.items ?? [];
  const totalApps = data?.total ?? 0;

  const deleteMutation = useDeleteApplication();
  const archiveMutation = useArchiveApplication();
  const bulkDelete = useBulkDelete();

  // Optimistic status change — card moves instantly, rolls back on failure.
  const qc = useQueryClient();
  const statusMutation = useUpdateStatus({
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['applications'] });
      const previous = qc.getQueriesData<{ items: Application[]; total: number }>({
        queryKey: ['applications'],
      });
      qc.setQueriesData<{ items: Application[]; total: number }>(
        { queryKey: ['applications'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((a) => (a.id === id ? { ...a, status } : a)),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Failed to move — reverted');
    },
    onSuccess: (app) => {
      toast.success(`Moved to ${STATUS_LABELS[app.status]}`);
    },
  });

  // Optimistic bulk status
  const bulkStatus = useBulkStatus({
    onMutate: async ({ ids, status }) => {
      await qc.cancelQueries({ queryKey: ['applications'] });
      const previous = qc.getQueriesData<{ items: Application[]; total: number }>({
        queryKey: ['applications'],
      });
      const idSet = new Set(ids);
      qc.setQueriesData<{ items: Application[]; total: number }>(
        { queryKey: ['applications'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((a) => (idSet.has(a.id) ? { ...a, status } : a)),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error('Bulk move failed — reverted');
    },
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = (status?: ApplicationStatus) => {
    setPresetStatus(status);
    setCreateOpen(true);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res = await api.get(`/applications/export`, {
        params: { format },
        responseType: 'blob',
      });
      const blob = res.data as Blob;
      const dispo = (res.headers as Record<string, string>)['content-disposition'] || '';
      const m = dispo.match(/filename="?([^";]+)"?/);
      const filename = m ? m[1] : `jobtrack-applications.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await statusMutation.mutateAsync({ id, status });
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this application?',
      description: 'This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Application deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleArchive = async (id: string, archive: boolean) => {
    try {
      await archiveMutation.mutateAsync({ id, archive });
      toast.success(archive ? 'Archived' : 'Restored');
    } catch {
      toast.error(archive ? 'Failed to archive' : 'Failed to restore');
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('all');
    setShowArchived(false);
    setArchivedOnly(false);
    setTagsInput('');
    setAppliedFrom('');
    setAppliedTo('');
    setSalaryMin('');
    setSalaryMax('');
    setSortKey('updatedAt-desc');
  };

  const hasActiveFilters =
    searchInput ||
    statusFilter !== 'all' ||
    showArchived ||
    archivedOnly ||
    tagsInput ||
    appliedFrom ||
    appliedTo ||
    salaryMin ||
    salaryMax;

  // Keyboard shortcuts (TASK-22)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as HTMLElement).isContentEditable);

      if (e.key === 'Escape') {
        if (createOpen) setCreateOpen(false);
        if (editing) setEditing(null);
        return;
      }
      if (isEditing) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openCreate();
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('dashboard-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOpen, editing]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      {/* Top bar */}
      <header className="border-b border-border bg-surface shrink-0">
        <div className="flex h-16 items-center justify-between gap-4 px-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold shrink-0">
            <div className="h-[22px] w-[22px] rounded-md bg-accent" />
            <span className="text-[15px] font-bold tracking-tight">JobTrack</span>
          </Link>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
            <Input
              id="dashboard-search"
              type="search"
              placeholder="Search company, title, location…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 bg-surface-sunken"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] text-text-secondary hidden sm:inline">
              {user?.email}
            </span>
            <Button onClick={() => openCreate()} size="sm">
              <Plus className="h-4 w-4" />
              Add application
            </Button>
            <ExportMenu onExport={handleExport} />
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-colors"
              aria-label="Toggle theme"
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/dashboard/settings"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-tertiary hover:bg-surface-sunken hover:text-danger transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-8 pt-6 pb-4 shrink-0">
          <div className="flex items-baseline gap-3">
            <h1 className="text-h1">My applications</h1>
            <span className="text-[12px] text-text-secondary">
              {totalApps} total · {apps.filter((a) => a.followUpDate).length} need a follow-up
            </span>
          </div>
        </div>

        {/* Filter toolbar (TASK-10) */}
        <div className="flex flex-wrap items-center gap-2 px-8 pb-4 shrink-0">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-7 w-auto px-2.5 text-[13px] font-medium bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'] as ApplicationStatus[]).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <div className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-surface border border-border-strong rounded-sm px-2.5 h-7">
            <input
              type="date"
              value={appliedFrom}
              onChange={(e) => setAppliedFrom(e.target.value)}
              className="bg-transparent text-[12.5px] text-text-secondary focus:outline-none w-[110px]"
              placeholder="Applied from"
              aria-label="Applied from"
            />
            <span className="text-text-tertiary">→</span>
            <input
              type="date"
              value={appliedTo}
              onChange={(e) => setAppliedTo(e.target.value)}
              className="bg-transparent text-[12.5px] text-text-secondary focus:outline-none w-[110px]"
              placeholder="Applied to"
              aria-label="Applied to"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-surface border border-border-strong rounded-sm px-2.5 h-7">
            <span className="text-text-tertiary">Tags:</span>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="remote, react"
              className="bg-transparent text-[12.5px] text-text-primary placeholder:text-text-tertiary focus:outline-none w-[140px]"
            />
          </div>

          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-7 w-auto px-2.5 text-[13px] font-medium bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>
                  Sort: {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="inline-flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-[15px] w-[15px] accent-accent"
              checked={showArchived}
              onChange={(e) => {
                setShowArchived(e.target.checked);
                if (!e.target.checked) setArchivedOnly(false);
              }}
            />
            Show archived
          </label>

          {showArchived && (
            <label className="inline-flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-[15px] w-[15px] accent-accent"
                checked={archivedOnly}
                onChange={(e) => setArchivedOnly(e.target.checked)}
              />
              Archived only
            </label>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-text-tertiary">
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}

          <div className="ml-auto inline-flex bg-surface-sunken border border-border rounded-sm p-0.5">
            <button
              type="button"
              onClick={() => setView('board')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-[5px] transition-all',
                view === 'board'
                  ? 'bg-surface text-text-primary shadow-sm-dark'
                  : 'text-text-tertiary hover:text-text-primary',
              )}
              aria-label="Board view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-[5px] transition-all',
                view === 'list'
                  ? 'bg-surface text-text-primary shadow-sm-dark'
                  : 'text-text-tertiary hover:text-text-primary',
              )}
              aria-label="List view"
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="px-8 pb-3">
          <StatsBar />
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-text-tertiary text-[13px]">
              Loading applications…
            </div>
          ) : apps.length === 0 ? (
            <EmptyState hasFilters={!!hasActiveFilters} onClear={clearFilters} onAdd={() => openCreate()} />
          ) : view === 'board' ? (
            <KanbanBoard
              applications={apps}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onAdd={openCreate}
              onEdit={(app) => {
                setEditing(app);
              }}
              onArchive={handleArchive}
              onSelectToggle={toggleSelect}
              selectedIds={selected}
              onUpdated={() => refetch()}
              search={search}
            />
          ) : (
            <ListView filters={filters} />
          )}
        </div>
      </main>

      <ApplicationFormDialog
        open={createOpen || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditing(null);
            setPresetStatus(undefined);
          }
        }}
        presetStatus={presetStatus}
        editing={editing}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onStatus={async (status) => {
            const ids = Array.from(selected);
            await bulkStatus.mutateAsync({ ids, status });
            toast.success(`Moved ${ids.length} application${ids.length > 1 ? 's' : ''}`);
            setSelected(new Set());
          }}
          onDelete={async () => {
            const ids = Array.from(selected);
            const ok = await confirm({
              title: `Delete ${ids.length} application${ids.length > 1 ? 's' : ''}?`,
              description: 'This cannot be undone.',
              confirmText: 'Delete all',
              destructive: true,
            });
            if (!ok) return;
            await bulkDelete.mutateAsync({ ids });
            toast.success(`Deleted ${ids.length} application${ids.length > 1 ? 's' : ''}`);
            setSelected(new Set());
          }}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
  onAdd,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onAdd: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="text-[14px] font-semibold mb-1">No applications match your filters</div>
        <div className="text-[12.5px] text-text-tertiary mb-4">
          Try adjusting or clearing them.
        </div>
        <Button variant="secondary" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="h-12 w-12 rounded-md bg-surface-sunken border border-border flex items-center justify-center mb-3">
        <LayoutGrid className="h-6 w-6 text-text-tertiary" />
      </div>
      <div className="text-[16px] font-semibold mb-1">No applications yet</div>
      <div className="text-[12.5px] text-text-tertiary mb-4 max-w-sm">
        Track every job you apply to. Add your first application to start building your pipeline.
      </div>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add your first application
      </Button>
    </div>
  );
}

function ListView({ filters }: { filters: Parameters<typeof useInfiniteApplications>[0] }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteApplications(filters);

  const apps = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-[13px]">
        Loading…
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary text-[13px]">
        No applications match your filters.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full mx-2">
      <div className="rounded-md border border-border bg-surface overflow-hidden flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-[13.5px]">
          <thead className="sticky top-0 bg-surface-sunken z-10">
            <tr className="text-left border-b border-border">
              <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Company</th>
              <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Title</th>
              <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Status</th>
              <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Location</th>
              <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Follow-up</th>
              <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Applied</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr
                key={a.id}
                className={cn(
                  'border-b border-border last:border-b-0 hover:bg-surface-sunken',
                  a.archived && 'opacity-60',
                )}
              >
                <td className="px-3.5 py-2.5 font-semibold">{a.company}</td>
                <td className="px-3.5 py-2.5 text-text-secondary">{a.title}</td>
                <td className="px-3.5 py-2.5 text-text-secondary">
                  {STATUS_LABELS[a.status]}
                  {a.archived && (
                    <span className="ml-2 text-[10.5px] uppercase tracking-wider text-text-tertiary">
                      Archived
                    </span>
                  )}
                </td>
                <td className="px-3.5 py-2.5 text-text-secondary">{a.location || '—'}</td>
                <td className="px-3.5 py-2.5 text-text-secondary">
                  {a.followUpDate ? new Date(a.followUpDate).toLocaleDateString() : '—'}
                </td>
                <td className="px-3.5 py-2.5 text-text-secondary">
                  {a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-1 py-2 text-[12px] text-text-tertiary">
        <span>
          Showing {apps.length} of {total}
        </span>
        {hasNextPage ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        ) : (
          <span>End of list</span>
        )}
      </div>
    </div>
  );
}

function ExportMenu({ onExport }: { onExport: (fmt: 'csv' | 'json') => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-colors"
        aria-label="Export"
      >
        <Download className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 min-w-[140px] bg-surface border border-border rounded-md shadow-md-dark p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onExport('csv');
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[13px] hover:bg-surface-sunken text-left"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onExport('json');
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[13px] hover:bg-surface-sunken text-left"
            >
              Download JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Sticky bottom action bar — appears when ≥1 card is selected
function BulkBar({
  count,
  onStatus,
  onDelete,
  onClear,
}: {
  count: number;
  onStatus: (status: ApplicationStatus) => Promise<void>;
  onDelete: () => Promise<void>;
  onClear: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-surface border border-border-strong shadow-lg-dark rounded-md px-3 py-2 flex items-center gap-2.5 text-[13px]">
      <span className="font-semibold">{count} selected</span>
      <Select onValueChange={(v) => onStatus(v as ApplicationStatus)}>
        <SelectTrigger className="h-7 w-auto px-2 text-[12.5px]">
          <SelectValue placeholder="Move to…" />
        </SelectTrigger>
        <SelectContent>
          {(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'] as ApplicationStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              Move to {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="danger" size="sm" onClick={onDelete}>
        Delete
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
      <span className="text-[11.5px] text-text-tertiary ml-1 hidden md:inline">
        Shift+click a card to select
      </span>
    </div>
  );
}

// Re-export hooks for useAuth compatibility shim if not yet implemented