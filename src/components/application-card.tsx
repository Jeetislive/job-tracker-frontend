'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MapPin, DollarSign, Bell, Paperclip, MoreHorizontal } from 'lucide-react';
import { Application } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
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

  const hasSalary = !!(application.salaryMin || application.salaryMax);
  const salary =
    application.salaryMin && application.salaryMax && application.salaryMin !== application.salaryMax
      ? `${formatCurrency(application.salaryMin)} – ${formatCurrency(application.salaryMax)}`
      : formatCurrency(application.salaryMin ?? application.salaryMax ?? null);

  const hasSubInfo = !!(application.followUpDate);
  const docCount = application._count?.documents ?? 0;

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0 : 1 }
    : undefined;

  const handleClick = () => {
    if (!isDragging) setDetailOpen(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className={cn(
          'group rounded-md border border-border bg-surface p-3.5 cursor-pointer select-none',
          'transition-[border-color,box-shadow,transform] duration-150 ease-smooth',
          'hover:border-border-strong',
          dragging && 'shadow-lg-dark rotate-[-0.5deg] scale-[1.02] border-accent',
        )}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold leading-tight truncate text-text-primary">
              {application.company}
            </p>
            <p className="text-[13px] text-text-secondary leading-tight mt-0.5 truncate">
              {application.title}
            </p>
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(application.id);
            }}
            className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-all"
            aria-label="Card options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {(application.location || hasSalary) && (
          <div className="flex flex-wrap gap-3 mt-2.5">
            {application.location && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary">
                <MapPin className="h-3 w-3" />
                {application.location}
              </span>
            )}
            {hasSalary && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary">
                <DollarSign className="h-3 w-3" />
                {salary}
              </span>
            )}
          </div>
        )}

        {(hasSubInfo || docCount > 0) && (
          <>
            <div className="h-px bg-border my-2.5" />
            <div className="flex flex-col gap-1.5">
              {application.followUpDate && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-stage-interview">
                  <Bell className="h-3 w-3" />
                  Follow up {formatDate(application.followUpDate)}
                </span>
              )}
              {docCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary">
                  <Paperclip className="h-3 w-3" />
                  {docCount} document{docCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </>
        )}

        {application.tags && application.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {application.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[11.5px] font-medium px-1.5 py-0.5 rounded-sm bg-surface-sunken text-text-secondary border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
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