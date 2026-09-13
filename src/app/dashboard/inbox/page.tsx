'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Inbox as InboxIcon, Check, X } from 'lucide-react';
import { InboxItem } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ImportReviewCard } from '@/components/inbox/import-review-card';
import { ApplicationFormDialog } from '@/components/application-form-dialog';
import { useConfirm } from '@/hooks/use-confirm';
import {
  INBOX_KEY,
  useBulkImportAction,
  useInbox,
  useRejectedImports,
  useConfirmImport,
} from '@/hooks/use-applications';

type Tab = 'pending' | 'rejected';

export default function InboxPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [editing, setEditing] = useState<InboxItem | null>(null);
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data: pending, isLoading } = useInbox({ refetchInterval: 30_000 });
  const { data: rejected } = useRejectedImports();
  const confirmOne = useConfirmImport();
  const bulkConfirm = useBulkImportAction('confirm');
  const bulkReject = useBulkImportAction('reject');

  const pendingCount = pending?.length ?? 0;
  const rejectedCount = rejected?.length ?? 0;
  const busy = bulkConfirm.isPending || bulkReject.isPending;

  const removeFromPending = (ids: string[]) => {
    const set = new Set(ids);
    qc.setQueryData<InboxItem[]>(INBOX_KEY, (old) => old?.filter((i) => !set.has(i.id)) ?? []);
  };

  const handleBulkConfirm = async () => {
    if (!pendingCount) return;
    const ok = await confirm({
      title: `Confirm ${pendingCount} import${pendingCount > 1 ? 's' : ''}?`,
      description: 'They will be added to your Kanban board.',
      confirmText: 'Confirm all',
    });
    if (!ok) return;
    const ids = (pending ?? []).map((i) => i.id);
    try {
      await bulkConfirm.mutateAsync(ids);
      toast.success(`Confirmed ${ids.length} import${ids.length > 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to confirm imports');
    }
  };

  const handleBulkReject = async () => {
    if (!pendingCount) return;
    const ok = await confirm({
      title: `Reject ${pendingCount} import${pendingCount > 1 ? 's' : ''}?`,
      description: 'They will be removed from your inbox. You can undo within 5 seconds.',
      confirmText: 'Reject all',
      destructive: true,
    });
    if (!ok) return;
    const ids = (pending ?? []).map((i) => i.id);
    removeFromPending(ids);
    toast(`Rejected ${ids.length} import${ids.length > 1 ? 's' : ''}`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          Promise.all(ids.map((id) => api.post(`/applications/${id}/unreject`)))
            .then(() => {
              qc.invalidateQueries({ queryKey: INBOX_KEY });
              qc.invalidateQueries({ queryKey: ['applications', 'inbox', 'rejected'] });
            })
            .catch(() => toast.error('Undo failed'));
        },
      },
    });
    try {
      await bulkReject.mutateAsync(ids);
    } catch {
      toast.error('Failed to reject imports');
    }
  };

  const handleEditSaved = async () => {
    if (!editing) return;
    try {
      await confirmOne.mutateAsync(editing.id);
      toast.success('Updated and confirmed — added to your board');
      setEditing(null);
    } catch {
      toast.error('Saved, but failed to confirm');
      setEditing(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-bg">
      <div className="max-w-[720px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <h1 className="text-h1 inline-flex items-center gap-2.5">
            <InboxIcon className="h-5 w-5 text-accent" />
            Inbox
          </h1>
          <Link
            href="/dashboard"
            className="text-[12.5px] text-text-tertiary hover:text-text-primary"
          >
            ← Back to board
          </Link>
        </div>
        <p className="text-[13px] text-text-tertiary mb-4">
          Applications captured automatically from email forwarding &amp; Telegram, waiting for
          your review.
        </p>

        {/* Tabs */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="inline-flex bg-surface-sunken border border-border rounded-sm p-0.5">
            <button
              type="button"
              onClick={() => setTab('pending')}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-[5px] text-[13px] font-medium transition-all ${
                tab === 'pending'
                  ? 'bg-surface text-text-primary shadow-sm-dark'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setTab('rejected')}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-[5px] text-[13px] font-medium transition-all ${
                tab === 'rejected'
                  ? 'bg-surface text-text-primary shadow-sm-dark'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {tab === 'pending' && pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleBulkReject} disabled={busy}>
                <X className="h-3.5 w-3.5" />
                Reject all
              </Button>
              <Button size="sm" onClick={handleBulkConfirm} disabled={busy}>
                <Check className="h-3.5 w-3.5" />
                {busy ? 'Working…' : 'Confirm all'}
              </Button>
            </div>
          )}
        </div>

        {/* List */}
        {tab === 'pending' ? (
          isLoading ? (
            <div className="flex items-center justify-center py-16 text-text-tertiary text-[13px]">
              Loading inbox…
            </div>
          ) : pendingCount === 0 ? (
            <div className="rounded-md border border-dashed border-border-strong py-14 px-8 text-center">
              <div className="h-12 w-12 rounded-md bg-surface-sunken border border-border flex items-center justify-center mx-auto mb-3">
                <InboxIcon className="h-6 w-6 text-text-tertiary" />
              </div>
              <div className="text-[15px] font-semibold mb-1">Nothing new!</div>
              <p className="text-[13px] text-text-tertiary max-w-sm mx-auto">
                Applications you apply to on Naukri, Foundit, LinkedIn, Indeed, Instahyre — or
                send via Telegram — will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending?.map((item) => (
                <ImportReviewCard key={item.id} item={item} onEdit={setEditing} />
              ))}
            </div>
          )
        ) : rejectedCount === 0 ? (
          <div className="rounded-md border border-dashed border-border-strong py-14 px-8 text-center">
            <div className="text-[14px] font-semibold mb-1">No rejected imports</div>
            <p className="text-[13px] text-text-tertiary">Rejected imports wait here for 30 days.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rejected?.map((item) => (
              <ImportReviewCard key={item.id} item={item} onEdit={setEditing} showRejectedState />
            ))}
          </div>
        )}
      </div>

      <ApplicationFormDialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        editing={editing}
        onSuccess={handleEditSaved}
      />
    </div>
  );
}