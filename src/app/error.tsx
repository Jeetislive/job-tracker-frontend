'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-bg text-text-primary">
      <div className="max-w-md text-center">
        <h2 className="text-[21px] font-bold mb-2">Something went wrong</h2>
        <p className="text-[13.5px] text-text-secondary mb-5">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}