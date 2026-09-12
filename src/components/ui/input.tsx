import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-sm border border-border-strong bg-surface-sunken px-2.5 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary transition-[border-color,box-shadow] duration-150 ease-smooth',
          'focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';