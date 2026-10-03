"use client";

import { useRouter } from "next/navigation";
import { HiOutlineArrowPath } from "react-icons/hi2";

export function RetryPanel({ message }: { message: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-subtle py-16 text-center">
      <p className="text-sm text-foreground/60">{message}</p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-5 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:border-brand-500 hover:text-brand-600"
      >
        <HiOutlineArrowPath className="size-4" />
        Tentar novamente
      </button>
    </div>
  );
}
