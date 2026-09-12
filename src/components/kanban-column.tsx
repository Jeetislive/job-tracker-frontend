'use client';

import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  id: string;
  title: string;
  color: string;
  count: number;
  onAdd?: () => void;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, color, count, onAdd, children }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col w-[288px] shrink-0 h-full">
      <div className="flex items-center justify-between px-1 pt-1 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="stage-dot"
            style={{ background: color }}
            aria-hidden
          />
          <h3 className="text-h3 font-semibold text-text-primary">{title}</h3>
          <span className="text-meta font-semibold text-text-tertiary bg-surface-sunken rounded-full px-2 py-0.5">
            {count}
          </span>
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-surface-sunken hover:text-text-primary transition-colors"
            aria-label={`Add application to ${title}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2.5 p-0.5 rounded-md transition-colors duration-150 overflow-y-auto scrollbar-thin',
          isOver && 'bg-accent-tint',
        )}
      >
        {children}
      </div>
    </div>
  );
}