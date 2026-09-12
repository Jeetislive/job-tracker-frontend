import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KanbanSquare, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <KanbanSquare className="h-5 w-5 text-primary" />
            <span>JobTrack</span>
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center">
        <div className="container text-center max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Track every application, <span className="text-primary">land every offer.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            A production-grade Kanban board for your job search. Drag applications across stages, set
            follow-up reminders, and never lose track of where you stand.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Start tracking free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built with Next.js, NestJS, Prisma, and BullMQ.
      </footer>
    </main>
  );
}