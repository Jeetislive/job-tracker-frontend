'use client';

import { useStats } from '@/hooks/use-applications';
import { ApplicationStatus, STATUS_LABELS } from '@/types';

const STAGE_HEX: Record<ApplicationStatus, string> = {
  SAVED: '#9AA3AE',
  APPLIED: '#5B9BF8',
  INTERVIEW: '#F5B23D',
  OFFER: '#3FBF97',
  REJECTED: '#F0676C',
};

export function StatsBar() {
  const { data } = useStats();

  if (!data) return null;

  const items: Array<{ key: string; label: string; value: number; color?: string }> = [
    { key: 'total', label: 'Total', value: data.total },
    ...Object.entries(data.byStatus).map(([key, value]) => ({
      key,
      label: STATUS_LABELS[key as ApplicationStatus],
      value: value as number,
      color: STAGE_HEX[key as ApplicationStatus],
    })),
    { key: 'followup', label: 'Follow-ups (7d)', value: data.upcomingFollowUps },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-md border border-border bg-surface px-3 py-2.5"
        >
          <div className="flex items-center gap-1.5 mb-1">
            {item.color && (
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: item.color }}
              />
            )}
            <p className="text-[11.5px] font-medium text-text-tertiary leading-tight">
              {item.label}
            </p>
          </div>
          <p className="text-[20px] font-bold leading-none text-text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  );
}