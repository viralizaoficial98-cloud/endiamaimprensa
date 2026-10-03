export function GridCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface">
      <div className="shimmer aspect-video" />
      <div className="flex flex-col gap-2 p-4">
        <div className="shimmer h-4 w-1/3 rounded-full" />
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <GridCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FeaturedBlockSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="shimmer min-h-[420px] rounded-3xl" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
        <div className="shimmer min-h-[200px] rounded-3xl" />
        <div className="shimmer min-h-[200px] rounded-3xl" />
      </div>
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="shimmer h-9 w-24 shrink-0 rounded-full" />
      ))}
    </div>
  );
}
