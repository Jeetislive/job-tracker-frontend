'use client';

import { useStats } from '@/hooks/use-applications';
import { STATUS_COLORS, STATUS_LABELS, ApplicationStatus } from '@/types';

export function StatsBar() {
  const { data } = useStats();

  if (!data) return null;

  const items: Array<{
    key: ApplicationStatus | string;
    label: string;
    value: number;
    color?: string;
  }> = [
    { key: 'total', label: 'Total', value: data.total },
    ...Object.entries(data.byStatus).map(([key, value]) => ({
      key,
      label: STATUS_LABELS[key as ApplicationStatus],
      value: value as number,
      color: STATUS_COLORS[key as ApplicationStatus],
    })),
    { key: 'followup', label: 'Follow-ups (7d)', value: data.upcomingFollowUps },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-6">
      {items.map((item) => (
        <div key={item.key} className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            {item.color && <span className={`h-2 w-2 rounded-full ${item.color}`} />}
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
          <p className="text-2xl font-bold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}