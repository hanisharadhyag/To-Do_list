import { TodoSkeletonList } from "@/components/todos/TodoSkeletonList";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-[61px] border-b border-slate-200 bg-white" />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-8 lg:flex-row">
        <div className="w-full shrink-0 space-y-4 lg:w-[250px]">
          <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <div className="h-10 w-48 animate-pulse rounded bg-slate-200/70" />
          <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <TodoSkeletonList count={5} />
        </div>
      </div>
    </div>
  );
}
