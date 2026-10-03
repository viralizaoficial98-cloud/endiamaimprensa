import { HiOutlineClock, HiOutlineEye } from "react-icons/hi2";
import { formatCompactNumber, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReadTime({ minutes, className }: { minutes: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <HiOutlineClock className="size-3.5" aria-hidden />
      {minutes} min
    </span>
  );
}

export function ViewCount({ views, className }: { views: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <HiOutlineEye className="size-3.5" aria-hidden />
      {formatCompactNumber(views)}
    </span>
  );
}

export function PublishedAt({ iso, className }: { iso: string; className?: string }) {
  return (
    <time dateTime={iso} className={className}>
      {formatRelativeTime(iso)}
    </time>
  );
}
