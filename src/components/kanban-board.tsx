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
  onUpdated: () => void;
}

export function KanbanBoard({ applications, onStatusChange, onDelete, onUpdated }: Props) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {APPLICATION_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            id={status}
            title={STATUS_LABELS[status]}
            count={grouped[status].length}
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
              <div className="text-xs text-muted-foreground italic px-1 py-4 text-center">
                Drop applications here
              </div>
            )}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>{activeApp && <ApplicationCard application={activeApp} dragging />}</DragOverlay>
    </DndContext>
  );
}