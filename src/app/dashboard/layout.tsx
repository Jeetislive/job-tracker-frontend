'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { useInbox } from '@/hooks/use-applications';
import { VerifyEmailBanner } from '@/components/verify-email-banner';
import { sourceMeta } from '@/types';

const NOTIFY_COOLDOWN_MS = 30_000;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Lightweight 60s poll (shared across dashboard routes) that toasts on new imports.
  const { data: inboxItems } = useInbox({ refetchInterval: 60_000 });
  const previousCount = useRef(0);
  const lastNotifiedAt = useRef(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !user) router.push('/login');
  }, [isHydrated, user, router]);

  useEffect(() => {
    if (!isHydrated || !user) return;
    const count = inboxItems?.length ?? 0;
    const now = Date.now();
    if (
      count > 0 &&
      count > previousCount.current &&
      previousCount.current > 0 &&
      now - lastNotifiedAt.current >= NOTIFY_COOLDOWN_MS &&
      pathname !== '/dashboard/inbox'
    ) {
      const newest = inboxItems?.[0];
      if (newest) {
        lastNotifiedAt.current = now;
        toast('📥 New import', {
          description: `${newest.title} @ ${newest.company} · ${sourceMeta(newest.source).label}`,
          duration: 8000,
          action: {
            label: 'Review →',
            onClick: () => router.push('/dashboard/inbox'),
          },
        });
      }
    }
    previousCount.current = count;
  }, [inboxItems, isHydrated, user, pathname, router]);

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
      {showBanner && <VerifyEmailBanner />}
      {children}
    </>
  );
}