'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { KanbanSquare, Plus, LogOut } from 'lucide-react';
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
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, refetch } = useApplications({ search });
  const apps: Application[] = data?.items ?? [];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    await api.patch(`/applications/${id}/status`, { status });
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    await api.delete(`/applications/${id}`);
    refetch();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <KanbanSquare className="h-5 w-5 text-primary" />
            <span>JobTrack</span>
          </Link>

          <div className="flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search company, title, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
            <Button onClick={handleLogout} size="sm" variant="ghost">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <StatsBar />

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading applications…</div>
        ) : (
          <KanbanBoard
            applications={apps}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onUpdated={() => refetch()}
          />
        )}
      </main>

      <ApplicationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          refetch();
        }}
      />
    </div>
  );
}