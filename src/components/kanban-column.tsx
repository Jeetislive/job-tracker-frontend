'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface Props {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, count, children }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg p-3 bg-muted/40 border border-border/50 min-h-[500px] flex flex-col gap-2 transition-colors',
        isOver && 'bg-primary/10 border-primary/50',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-background border">{count}</span>
      </div>
      <div className="flex flex-col gap-2 flex-1">{children}</div>
    </div>
  );
}