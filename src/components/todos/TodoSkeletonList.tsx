export function TodoSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading tasks"
      className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-4 px-5 py-4"
        >
          <div className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded border border-slate-200 bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/80" />
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="flex items-center gap-3 pt-0.5">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-14 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
