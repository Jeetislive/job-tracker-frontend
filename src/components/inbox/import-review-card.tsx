'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Check, X, Bell } from 'lucide-react';
import { InboxItem } from '@/types';
import { formatDate, formatSalaryRange, timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SourceBadge } from '@/components/source-badge';
import {
  INBOX_KEY,
  useConfirmImport,
  useRejectImport,
  useUnrejectImport,
} from '@/hooks/use-applications';

interface Props {
  item: InboxItem;
  onEdit?: (item: InboxItem) => void;
  /** Treat as "rejected", e.g. when rendered from the Rejected tab. */
  showRejectedState?: boolean;
}

export function ImportReviewCard({ item, onEdit, showRejectedState }: Props) {
  const qc = useQueryClient();
  const confirmMutation = useConfirmImport();
  const rejectMutation = useRejectImport();
  const unrejectMutation = useUnrejectImport();

  const path = item.importPayload?._meta?.path ?? (item.importConfidence != null && item.importConfidence >= 0.95 ? 'llm' : 'regex');
  const pathLabel = path === 'llm' ? 'LLM' : 'regex';
  const confidence = item.importConfidence != null ? Math.round(item.importConfidence * 100) : null;
  const appliedLabel =
    item.appliedDate ? `Applied ${formatDate(item.appliedDate)}` : `Imported ${timeAgo(item.importedAt)}`;

  const removeFromPending = () => {
    qc.setQueryData<InboxItem[]>(INBOX_KEY, (old) => old?.filter((i) => i.id !== item.id) ?? []);
  };

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(item.id);
      toast.success(`${item.company} — confirmed and added to your board`);
    } catch {
      toast.error('Failed to confirm');
    }
  };

  const handleReject = () => {
    removeFromPending();
    toast(`Rejected "${item.company} — ${item.title}"`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          unrejectMutation.mutate(item.id, {
            onError: () => qc.invalidateQueries({ queryKey: INBOX_KEY }),
          });
        },
      },
    });
    rejectMutation.mutate(item.id, {
      onError: () => {
        qc.invalidateQueries({ queryKey: INBOX_KEY });
        toast.error('Failed to reject');
      },
    });
  };

  return (
    <div
      className={`rounded-md border border-border bg-surface p-4 transition-all ${
        showRejectedState ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <SourceBadge source={item.source} />
          {item.importedAt && !showRejectedState && (
            <span className="text-[11.5px] text-text-tertiary">{timeAgo(item.importedAt)}</span>
          )}
        </div>
        {confidence != null && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold bg-surface-sunken text-text-secondary border border-border"
            title="Extraction confidence"
          >
            {showRejectedState && (
              <span className="uppercase tracking-wider text-text-tertiary">Rejected · </span>
            )}
            {confidence}% ({pathLabel})
          </span>
        )}
      </div>

      <p className="text-[15px] font-semibold leading-tight truncate">{item.title}</p>
      <p className="text-[13.5px] text-text-secondary leading-tight truncate mt-0.5 mb-2">
        {item.company}
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-text-tertiary">
        <span>{item.location || '—'}</span>
        {formatSalaryRange(item.salaryMin, item.salaryMax, item.currency) && (
          <span>{formatSalaryRange(item.salaryMin, item.salaryMax, item.currency)}</span>
        )}
        <span className="inline-flex items-center gap-1">
          <Bell className="h-3 w-3" />
          {appliedLabel}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3.5">
        <Button size="sm" onClick={handleConfirm} disabled={confirmMutation.isPending}>
          <Check className="h-3.5 w-3.5" />
          Confirm
        </Button>
        {!showRejectedState && (
          <Button size="sm" variant="secondary" onClick={handleReject} disabled={rejectMutation.isPending}>
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        )}
        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(item)}
            className="text-text-tertiary"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}