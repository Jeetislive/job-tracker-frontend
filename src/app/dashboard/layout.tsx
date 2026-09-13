'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !user) router.push('/login');
  }, [isHydrated, user, router]);

  if (!isHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text-tertiary text-[13px]">Loading…</div>
      </div>
    );
  }

  const showBanner = user.emailVerified === false;

  return (
    <>
      {showBanner && (
        <div className="bg-stage-interview/15 border-b border-stage-interview/40 px-8 py-2.5 flex items-center justify-between gap-3 text-[12.5px]">
          <div className="flex items-center gap-2 text-text-primary">
            <Mail className="h-3.5 w-3.5 text-stage-interview" />
            <span>
              Verify your email — check your inbox for a confirmation link.{' '}
              {/* TODO(BE): POST /api/auth/resend-verification { email } */}
            </span>
          </div>
          <button
            type="button"
            className="text-text-tertiary hover:text-text-primary"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {children}
    </>
  );
}