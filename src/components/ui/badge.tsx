import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-accent-tint text-accent',
        secondary: 'bg-surface-sunken text-text-secondary border border-border',
        outline: 'border border-border-strong text-text-secondary',
        saved: 'bg-[rgba(154,163,174,0.14)] text-[#9AA3AE]',
        applied: 'bg-[rgba(91,155,248,0.14)] text-[#5B9BF8]',
        interview: 'bg-[rgba(245,178,61,0.14)] text-[#F5B23D]',
        offer: 'bg-accent-tint text-accent',
        rejected: 'bg-[rgba(240,103,108,0.14)] text-[#F0676C]',
      },
      size: {
        sm: 'text-[11.5px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-0.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'sm' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}