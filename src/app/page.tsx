import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Bell, Clock, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="bg-glow" />
      <div className="bg-grid" />

      {/* Navbar */}
      <nav className="relative z-10 max-w-[1160px] w-full mx-auto flex items-center justify-between px-8 sm:px-14 pt-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-accent" />
          <span className="text-[14px] font-bold">JobTrack</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[13px] font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link href="/register">
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-[1160px] w-full mx-auto px-8 sm:px-14 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 text-accent font-bold text-[11px] tracking-[0.14em] uppercase mb-4">
            For people running an active job search
          </div>
          <h1 className="text-[38px] sm:text-[44px] font-bold leading-[1.1] tracking-[-0.02em] max-w-[460px]">
            Your job search, laid out like a pipeline.
          </h1>
          <p className="mt-4 text-[14.5px] leading-[1.65] text-text-secondary max-w-[410px]">
            Every application, interview, and offer in one board — so you always know
            what&apos;s moving, what&apos;s stalled, and what needs a follow-up today.
          </p>
          <div className="flex gap-2.5 mt-6">
            <Button asChild size="lg">
              <Link href="/register">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>
        </div>

        {/* Visual */}
        <div className="bg-surface-sunken border border-border rounded-lg shadow-lg-dark p-4 rotate-[1deg]">
          <div className="rotate-[-1.2deg]">
            <div className="flex gap-2.5">
              {[
                { label: 'Applied', color: '#5B9BF8', count: 2 },
                { label: 'Interview', color: '#F5B23D', count: 1 },
                { label: 'Offer', color: '#3FBF97', count: 1 },
              ].map((col) => (
                <div key={col.label} className="flex-1 flex flex-col gap-2">
                  <div className="text-[11px] font-bold text-text-tertiary px-0.5 pb-1 flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: col.color }}
                    />
                    {col.label}
                  </div>
                  {Array.from({ length: col.count }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-surface border border-border rounded-md p-2"
                    >
                      <div className="h-2 w-[70%] bg-text-primary opacity-85 rounded mb-1.5" />
                      <div className="h-1.5 w-[50%] bg-border-strong rounded" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 max-w-[1160px] w-full mx-auto px-8 sm:px-14 py-14 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-border"
      >
        {[
          {
            icon: LayoutGrid,
            title: 'A board, not a spreadsheet',
            body:
              "Drag applications through Saved, Applied, Interview, Offer, and Rejected — the state of your search at a glance.",
          },
          {
            icon: Bell,
            title: 'Reminders that catch you',
            body:
              'Set a follow-up date on any application and get an email before it goes cold.',
          },
          {
            icon: Clock,
            title: 'Nothing gets lost',
            body:
              'Every note, status change, and document is logged, so you can pick up any thread months later.',
          },
        ].map((feature) => (
          <div key={feature.title}>
            <div className="h-[38px] w-[38px] rounded-md bg-accent-tint text-accent flex items-center justify-center mb-4">
              <feature.icon className="h-[19px] w-[19px]" />
            </div>
            <h3 className="text-[16px] font-semibold mb-2">{feature.title}</h3>
            <p className="text-[14px] text-text-secondary leading-relaxed">
              {feature.body}
            </p>
          </div>
        ))}
      </section>

      <footer className="relative z-10 border-t border-border mt-auto py-6 px-8 sm:px-14">
        <div className="max-w-[1160px] w-full mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[13px] text-text-tertiary">
          <span>© 2026 JobTrack</span>
          <div className="flex gap-5">
            <span className="hover:text-text-secondary cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-text-secondary cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-text-secondary cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </main>
  );
}