import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-surface shrink-0">
        <div className="flex h-16 items-center justify-between gap-4 px-8">
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-[22px] w-[22px] rounded-md" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-9 flex-1 max-w-md rounded-sm" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-28 rounded-sm" />
            <Skeleton className="h-8 w-8 rounded-sm" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 pt-6 pb-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="px-8 pb-4 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-sm" />
          ))}
        </div>
        <div className="px-8 pb-3 grid grid-cols-3 md:grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
        <div className="flex-1 flex gap-4 px-8 pb-6 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[288px] flex flex-col gap-2.5 shrink-0">
              <Skeleton className="h-7 w-full rounded-sm" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-[110px] w-full rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}