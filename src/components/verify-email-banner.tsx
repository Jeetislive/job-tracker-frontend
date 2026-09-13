'use client';

import { useEffect, useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useResendVerification } from '@/hooks/use-resend-verification';

const DISMISS_KEY = 'jt:verify-banner-dismissed';

export function VerifyEmailBanner() {
  const user = useAuthStore((s) => s.user);
  const { resend, countdown, isPending } = useResendVerification();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true);
    }
  }, []);

  if (!user || user.emailVerified !== false || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') sessionStorage.setItem(DISMISS_KEY, '1');
  };

  const busy = isPending || countdown > 0;

  return (
    <div className="bg-stage-interview/15 border-b border-stage-interview/40 px-8 py-2.5 flex items-center justify-between gap-3 text-[12.5px]">
      <div className="flex items-center gap-2 text-text-primary min-w-0">
        <Mail className="h-3.5 w-3.5 text-stage-interview shrink-0" />
        <span className="truncate">Verify your email to keep your account safe.</span>
        <button
          type="button"
          onClick={() => resend(user.email)}
          disabled={busy}
          className="shrink-0 font-semibold text-accent hover:underline disabled:opacity-50 disabled:pointer-events-none"
        >
          {countdown > 0 ? `Resend in ${countdown}s` : isPending ? 'Sending…' : 'Resend verification email'}
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-text-tertiary hover:text-text-primary shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}