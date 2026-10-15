export default function Loading() {
  return (
    <div className="space-y-8" aria-label="Loading">
      <div className="min-h-[320px] animate-pulse rounded-2xl border border-border bg-surface" aria-hidden="true">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
          <div className="aspect-[3/4] w-40 shrink-0 rounded-xl bg-border sm:w-52" />
          <div className="flex-1">
            <div className="h-8 w-2/3 rounded bg-border" />
            <div className="mt-3 h-4 w-1/4 rounded bg-border" />
            <div className="mt-6 h-11 w-44 rounded-full bg-border" />
          </div>
        </div>
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-surface" aria-hidden="true" />
      <div className="h-24 animate-pulse rounded-xl bg-surface" aria-hidden="true" />
    </div>
  );
}
