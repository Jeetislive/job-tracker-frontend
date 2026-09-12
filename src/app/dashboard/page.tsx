'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, LogOut, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApplications } from '@/hooks/use-applications';
import { KanbanBoard } from '@/components/kanban-board';
import { ApplicationFormDialog } from '@/components/application-form-dialog';
import { StatsBar } from '@/components/stats-bar';
import { Application, ApplicationStatus } from '@/types';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [createOpen, setCreateOpen] = useState(false);
  const [presetStatus, setPresetStatus] = useState<ApplicationStatus | undefined>();

  const { data, isLoading, refetch } = useApplications({ search });
  const apps: Application[] = data?.items ?? [];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      await api.patch(`/applications/${id}/status`, { status });
      refetch();
    } catch {
      toast.error('Failed to move card');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application? This cannot be undone.')) return;
    try {
      await api.delete(`/applications/${id}`);
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const openCreate = (status?: ApplicationStatus) => {
    setPresetStatus(status);
    setCreateOpen(true);
  };

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
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <Input
              type="search"
              placeholder="Search company, title, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-surface-sunken"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] text-text-secondary hidden sm:inline">
              {user?.email}
            </span>
            <Button
              onClick={() => openCreate()}
              size="sm"
              className="text-[13px]"
            >
              <Plus className="h-4 w-4" />
              Add application
            </Button>
            <button
              type="button"
              onClick={handleLogout}
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
              {apps.length} total · {apps.filter((a) => a.followUpDate).length} need a follow-up
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 pb-4 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-surface border border-border-strong rounded-sm px-2.5 py-1.5 text-text-secondary cursor-pointer hover:bg-surface-sunken">
              Status
            </div>
            <div className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-surface border border-border-strong rounded-sm px-2.5 py-1.5 text-text-secondary cursor-pointer hover:bg-surface-sunken">
              Date range
            </div>
            <div className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-surface border border-border-strong rounded-sm px-2.5 py-1.5 text-text-secondary cursor-pointer hover:bg-surface-sunken">
              Sort: Newest
            </div>
          </div>
          <div className="inline-flex bg-surface-sunken border border-border rounded-sm p-0.5">
            <button
              type="button"
              onClick={() => setView('board')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] transition-all ${
                view === 'board'
                  ? 'bg-surface text-text-primary shadow-sm-dark'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              aria-label="Board view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] transition-all ${
                view === 'list'
                  ? 'bg-surface text-text-primary shadow-sm-dark'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
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
          ) : view === 'board' ? (
            <KanbanBoard
              applications={apps}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onAdd={openCreate}
              onUpdated={() => refetch()}
            />
          ) : (
            <ListView apps={apps} onRefetch={() => refetch()} />
          )}
        </div>
      </main>

      <ApplicationFormDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setPresetStatus(undefined);
        }}
        presetStatus={presetStatus}
        onSuccess={() => {
          setCreateOpen(false);
          setPresetStatus(undefined);
          refetch();
        }}
      />
    </div>
  );
}

function ListView({ apps }: { apps: Application[]; onRefetch: () => void }) {
  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden mx-2">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="text-left bg-surface-sunken border-b border-border">
            <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Company</th>
            <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Title</th>
            <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Status</th>
            <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Location</th>
            <th className="px-3.5 py-2.5 text-meta text-text-tertiary font-normal">Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {apps.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-8 text-text-tertiary">
                No applications yet
              </td>
            </tr>
          )}
          {apps.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-b-0 hover:bg-surface-sunken">
              <td className="px-3.5 py-2.5 font-semibold">{a.company}</td>
              <td className="px-3.5 py-2.5 text-text-secondary">{a.title}</td>
              <td className="px-3.5 py-2.5">
                <span className="text-meta text-text-secondary">{a.status}</span>
              </td>
              <td className="px-3.5 py-2.5 text-text-secondary">{a.location || '—'}</td>
              <td className="px-3.5 py-2.5 text-text-secondary">
                {a.followUpDate ? new Date(a.followUpDate).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}