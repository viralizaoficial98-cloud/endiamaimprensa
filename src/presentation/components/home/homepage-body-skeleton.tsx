import { Container } from "@/presentation/components/ui/container";

/** Generic full-body fallback — only used for the very first paint before any
 * section-level Suspense boundary has taken over (see homepage-body.tsx). */
export function HomepageBodySkeleton() {
  return (
    <div className="animate-pulse py-20 sm:py-28">
      <Container>
        <div className="h-8 w-56 rounded-full bg-surface-muted" />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </Container>
    </div>
  );
}

/** Reserves space for a section made of N card-ish tiles, so nothing jumps
 * when the real grid (gallery, events, documents, videos...) mounts. */
export function GridSectionSkeleton({ tiles = 4 }: { tiles?: number }) {
  return (
    <div className="animate-pulse py-20 sm:py-28">
      <Container>
        <div className="h-8 w-56 rounded-full bg-surface-muted" />
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {Array.from({ length: tiles }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </Container>
    </div>
  );
}

/** Compact fallback for a horizontal strip of small news cards. */
export function StripSectionSkeleton() {
  return (
    <div className="animate-pulse py-16">
      <Container>
        <div className="h-6 w-44 rounded-full bg-surface-muted" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-surface-muted" />
          ))}
        </div>
      </Container>
    </div>
  );
}

/** Short band placeholder for the logo strip (Partners). */
export function BandSectionSkeleton() {
  return (
    <div className="animate-pulse py-20 sm:py-24">
      <Container>
        <div className="h-6 w-32 rounded-full bg-surface-muted" />
        <div className="mt-8 flex gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 flex-1 rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </Container>
    </div>
  );
}
