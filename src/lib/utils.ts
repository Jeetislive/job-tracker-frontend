import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency?: string | null,
): string {
  if (!min && !max) return '';
  const fmt = (v: number) => {
    const localized = v.toLocaleString('en-US');
    if (currency && currency !== 'USD') return `${currency} ${localized}`;
    return `$${localized}`;
  };
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(date);
}