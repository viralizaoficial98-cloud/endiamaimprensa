import Link from "next/link";
import type { Tag } from "@/domain/entities";

export function TagsList({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/pesquisa?q=${encodeURIComponent(tag.name)}`}
          className="rounded-full border border-border-subtle px-3.5 py-1.5 text-xs font-medium capitalize text-foreground/60 transition-colors hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400"
        >
          #{tag.name}
        </Link>
      ))}
    </div>
  );
}
