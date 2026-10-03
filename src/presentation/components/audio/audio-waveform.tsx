import { cn } from "@/lib/utils";

/** Deterministic per-bar heights so the waveform looks organic without random re-renders. */
const BAR_HEIGHTS = [0.4, 0.7, 0.45, 1, 0.55, 0.85, 0.35, 0.65, 0.9, 0.5, 0.75, 0.4];

/** Purely decorative CSS waveform — bars pulse only while `active`, otherwise
 * they sit static at varied heights. No canvas/audio-analysis library. */
export function AudioWaveform({ active = false, className, barClassName }: { active?: boolean; className?: string; barClassName?: string }) {
  return (
    <div className={cn("flex h-4 items-center gap-[3px]", className)} aria-hidden="true">
      {BAR_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full bg-current", active && "animate-waveform", barClassName)}
          style={{
            height: `${Math.max(h * 100, 20)}%`,
            transform: active ? undefined : `scaleY(${h})`,
            animationDelay: `${(i % 6) * 0.11}s`,
          }}
        />
      ))}
    </div>
  );
}
