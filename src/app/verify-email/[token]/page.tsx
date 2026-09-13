'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useResendVerification } from '@/hooks/use-resend-verification';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle } from 'lucide-react';

type State = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [state, setState] = useState<State>('verifying');
  const [message, setMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const { resend, countdown, isPending } = useResendVerification();

  // Hydrate the store so we can update emailVerified without a reload.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post<{ message: string }>('/auth/verify-email', {
          token: params.token,
        });
        if (cancelled) return;
        const current = useAuthStore.getState().user;
        if (current) {
          useAuthStore.getState().setUser({ ...current, emailVerified: true });
        }
        setMessage(data.message);
        setState('success');
        setTimeout(() => router.push('/dashboard'), 1500);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setMessage(typeof msg === 'string' ? msg : 'Verification link is invalid or expired.');
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.token, router]);

  const resendEmail = user?.email ?? emailInput;
  const resendBusy = isPending || countdown > 0;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-[360px] rounded-lg border border-border bg-surface shadow-lg-dark p-6 text-center">
        {state === 'verifying' && (
          <>
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-border-strong border-t-accent animate-spin mb-4" />
            <h1 className="text-[19px] font-bold">Verifying your email…</h1>
            <p className="text-[13px] text-text-secondary mt-2">This will only take a moment.</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-accent mb-4" />
            <h1 className="text-[19px] font-bold">Email verified</h1>
            <p className="text-[13px] text-text-secondary mt-2">{message}</p>
            <p className="text-[12px] text-text-tertiary mt-3">Redirecting to your dashboard…</p>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-danger mb-4" />
            <h1 className="text-[19px] font-bold">Verification failed</h1>
            <p className="text-[13px] text-text-secondary mt-2">{message}</p>
            {!user && (
              <Input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email"
                className="mt-4"
              />
            )}
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              disabled={!resendEmail || resendBusy}
              onClick={() => resend(resendEmail)}
            >
              {countdown > 0 ? `Resend email (${countdown}s)` : isPending ? 'Sending…' : 'Resend email'}
            </Button>
            <div className="flex justify-center gap-2 mt-5">
              <Button asChild variant="secondary">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}