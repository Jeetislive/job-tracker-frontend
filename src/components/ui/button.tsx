import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-semibold transition-[background,border-color,color,box-shadow,transform] duration-150 ease-smooth active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-fg hover:bg-accent-hover',
        secondary: 'bg-surface text-text-primary border border-border-strong hover:bg-surface-sunken',
        outline: 'bg-transparent text-text-secondary border border-border-strong hover:bg-surface-sunken hover:text-text-primary',
        ghost: 'bg-transparent text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
        danger: 'bg-danger text-[#1A0B0C] hover:bg-[#D8555C]',
        link: 'text-accent underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-3.5 text-[13px]',
        sm: 'h-7 px-2.5 text-[12px]',
        lg: 'h-11 px-4 text-[14px]',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';