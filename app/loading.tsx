function CardSkeleton() {
  return (
    <div className="w-36 shrink-0 sm:w-40" aria-hidden="true">
      <div className="aspect-[3/4] animate-pulse rounded-lg bg-surface" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface" />
      <div className="mt-1 h-2 w-1/2 animate-pulse rounded bg-surface" />
    </div>
  );
}

function RailSkeleton() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-hidden px-4 sm:-mx-6 sm:px-6" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-10" aria-label="Loading">
      {/* Hero skeleton */}
      <div className="relative min-h-[380px] animate-pulse overflow-hidden rounded-3xl border border-border bg-surface md:min-h-[440px]" aria-hidden="true">
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="h-4 w-24 rounded bg-border" />
          <div className="mt-3 h-10 w-2/3 rounded bg-border" />
          <div className="mt-3 h-4 w-1/3 rounded bg-border" />
          <div className="mt-4 h-16 w-1/2 rounded bg-border" />
          <div className="mt-6 flex gap-3">
            <div className="h-11 w-36 rounded-full bg-border" />
            <div className="h-11 w-28 rounded-full bg-border" />
          </div>
        </div>
      </div>
      <RailSkeleton />
      <RailSkeleton />
    </div>
  );
}
