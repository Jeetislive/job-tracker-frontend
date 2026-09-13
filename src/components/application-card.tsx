'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MapPin, DollarSign, Bell, Paperclip, Archive, ArchiveRestore, MoreHorizontal } from 'lucide-react';
import { Application } from '@/types';
import { formatCurrency, formatDate, timeAgo, cn } from '@/lib/utils';
import { ApplicationDetailDialog } from './application-detail-dialog';
import { SourceBadge } from './source-badge';

interface Props {
  application: Application;
  onDelete?: (id: string) => void;
  onUpdated?: () => void;
  onEdit?: (app: Application) => void;
  onArchive?: (id: string, archive: boolean) => void;
  onSelectToggle?: (id: string) => void;
  selected?: boolean;
  search?: string;
  dragging?: boolean;
}

function highlight(text: string, q?: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-stage-interview/30 text-text-primary rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function ApplicationCard({
  application,
  onDelete,
  onUpdated,
  onEdit,
  onArchive,
  onSelectToggle,
  selected,
  search,
  dragging,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    if (e.shiftKey && onSelectToggle) {
      e.preventDefault();
      onSelectToggle(application.id);
      return;
    }
    setDetailOpen(true);
  };

  const isArchived = application.archived;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className={cn(
          'group relative rounded-md border bg-surface p-3.5 cursor-pointer select-none',
          'transition-[border-color,box-shadow,transform,opacity] duration-150 ease-smooth',
          'hover:border-border-strong',
          dragging && 'shadow-lg-dark rotate-[-0.5deg] scale-[1.02] border-accent',
          isArchived && 'opacity-60',
          selected && 'border-accent ring-1 ring-accent',
        )}
      >
        {isArchived && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-sm bg-surface-sunken text-text-tertiary border border-border">
              <Archive className="h-2.5 w-2.5" />
              Archived
            </span>
          </div>
        )}
        {application.source && application.source !== 'manual' && (
          <div className="flex items-center justify-between gap-2 mb-2">
            <SourceBadge source={application.source} />
            {application.importedAt && (
              <span className="text-[11px] text-text-tertiary">{timeAgo(application.importedAt)}</span>
            )}
          </div>
        )}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold leading-tight truncate text-text-primary">
              {highlight(application.company, search)}
            </p>
            <p className="text-[13px] text-text-secondary leading-tight mt-0.5 truncate">
              {highlight(application.title, search)}
            </p>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-all"
              aria-label="Card options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute z-40 right-0 top-full mt-1 min-w-[160px] bg-surface border border-border rounded-md shadow-md-dark p-1">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(application);
                      }}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[13px] hover:bg-surface-sunken text-left"
                    >
                      Edit
                    </button>
                  )}
                  {onArchive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onArchive(application.id, !isArchived);
                      }}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[13px] hover:bg-surface-sunken text-left"
                    >
                      {isArchived ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5" />
                          Restore
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5" />
                          Archive
                        </>
                      )}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(application.id);
                      }}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-[13px] hover:bg-danger-tint text-danger text-left"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {(application.location || hasSalary) && (
          <div className="flex flex-wrap gap-3 mt-2.5">
            {application.location && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary">
                <MapPin className="h-3 w-3" />
                {highlight(application.location, search)}
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
                {highlight(tag, search)}
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
        onEdit={onEdit ? () => onEdit(application) : undefined}
      />
    </>
  );
}