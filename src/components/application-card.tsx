'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Application } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Trash2, ExternalLink, Calendar, Banknote } from 'lucide-react';
import { ApplicationDetailDialog } from './application-detail-dialog';

interface Props {
  application: Application;
  onDelete?: (id: string) => void;
  onUpdated?: () => void;
  dragging?: boolean;
}

export function ApplicationCard({ application, onDelete, onUpdated, dragging }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    disabled: dragging,
  });

  const salary =
    application.salaryMin || application.salaryMax
      ? `${formatCurrency(application.salaryMin ?? 0)}${
          application.salaryMax ? ` – ${formatCurrency(application.salaryMax)}` : ''
        }`
      : null;

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0 : 1 }
    : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'rounded-md border bg-card p-3 shadow-sm hover:shadow-md transition cursor-grab active:cursor-grabbing',
          dragging && 'shadow-xl ring-2 ring-primary cursor-grabbing',
        )}
        onDoubleClick={() => setDetailOpen(true)}
      >
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{application.company}</p>
            <p className="text-xs text-muted-foreground truncate">{application.title}</p>
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(application.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-destructive transition"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {application.location && <p className="truncate">📍 {application.location}</p>}
          {salary && (
            <p className="flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              {salary}
            </p>
          )}
          {application.followUpDate && (
            <p className="flex items-center gap-1 text-amber-600">
              <Calendar className="h-3 w-3" />
              {formatDate(application.followUpDate)}
            </p>
          )}
        </div>

        {application.tags && application.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {application.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {application.url && (
          <a
            href={application.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
          >
            <ExternalLink className="h-3 w-3" />
            View posting
          </a>
        )}
      </div>

      <ApplicationDetailDialog
        applicationId={application.id}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={onUpdated}
      />
    </>
  );
}