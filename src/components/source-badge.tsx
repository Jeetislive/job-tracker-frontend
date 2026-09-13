'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { sourceMeta } from '@/types';

export function SourceBadge({
  source,
  className,
}: {
  source?: string | null;
  className?: string;
}) {
  const meta = sourceMeta(source);
  return (
    <Badge variant="outline" size="sm" className={cn('gap-1 text-[11px]', meta.color, className)}>
      <span aria-hidden>{meta.icon}</span>
      <span>{meta.label}</span>
    </Badge>
  );
}