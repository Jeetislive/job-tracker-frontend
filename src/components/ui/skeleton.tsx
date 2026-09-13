import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: Props) {
  return <div className={cn('skeleton', className)} style={style} />;
}