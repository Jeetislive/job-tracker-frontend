'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Application, APPLICATION_STATUSES, ApplicationStatus, STATUS_LABELS } from '@/types';
import { KanbanColumn } from './kanban-column';
import { ApplicationCard } from './application-card';

interface Props {
  applications: Application[];
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onAdd?: (status: ApplicationStatus) => void;
  onUpdated: () => void;
}

const STAGE_COLORS: Record<ApplicationStatus, string> = {
  SAVED: '#9AA3AE',
  APPLIED: '#5B9BF8',
  INTERVIEW: '#F5B23D',
  OFFER: '#3FBF97',
  REJECTED: '#F0676C',
};

export function KanbanBoard({
  applications,
  onStatusChange,
  onDelete,
  onAdd,
  onUpdated,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const map = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, [] as Application[]])) as Record<
      ApplicationStatus,
      Application[]
    >;
    for (const app of applications) map[app.status].push(app);
    return map;
  }, [applications]);

  const activeApp = applications.find((a) => a.id === activeId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as ApplicationStatus;
    if (!APPLICATION_STATUSES.includes(newStatus)) return;

    const app = applications.find((a) => a.id === active.id);
    if (!app || app.status === newStatus) return;

    onStatusChange(app.id, newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full min-w-max px-2 pb-6">
        {APPLICATION_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            id={status}
            title={STATUS_LABELS[status]}
            color={STAGE_COLORS[status]}
            count={grouped[status].length}
            onAdd={onAdd ? () => onAdd(status) : undefined}
          >
            {grouped[status].map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onDelete={onDelete}
                onUpdated={onUpdated}
              />
            ))}
            {grouped[status].length === 0 && (
              <div className="border-[1.5px] border-dashed border-border-strong rounded-md py-6 px-3 text-center text-text-tertiary text-[12.5px]">
                No applications yet
              </div>
            )}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeApp && (
          <div className="rotate-[-1deg] scale-[1.02]">
            <ApplicationCard application={activeApp} dragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}