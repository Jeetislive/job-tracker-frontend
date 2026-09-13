'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const RESEND_COOLDOWN_S = 30;

/**
 * Shared "resend verification email" logic (PATCH-safe: respects a 30s cooldown,
 * never hammers the endpoint which is throttled to 10/min per IP).
 */
export function useResendVerification() {
  const [countdown, setCountdown] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  const resend = useCallback(
    async (email: string) => {
      if (!email || countdown > 0) return;
      setIsPending(true);
      try {
        await api.post('/auth/resend-verification', { email });
        toast.success('Verification email sent');
        setCountdown(RESEND_COOLDOWN_S);
      } catch {
        toast.error('Failed to resend — try again in a moment');
      } finally {
        setIsPending(false);
      }
    },
    [countdown],
  );

  return { resend, countdown, isPending };
}