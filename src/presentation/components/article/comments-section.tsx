"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { HiOutlineHandThumbUp, HiOutlinePaperAirplane } from "react-icons/hi2";
import type { NewsComment } from "@/domain/entities";
import { submitComment } from "@/application/use-cases/comment-use-cases";
import { formatRelativeTime } from "@/lib/format";
import { Reveal } from "@/presentation/components/ui/reveal";

export function CommentsSection({ newsId, initialComments }: { newsId: string; initialComments: NewsComment[] }) {
  const [comments] = useState(initialComments);
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !name.trim() || status === "submitting") return;
    setStatus("submitting");
    try {
      await submitComment(newsId, { content: draft.trim(), guestName: name.trim() });
      setDraft("");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Reveal as="section">
      <h2 className="font-heading text-xl font-medium text-foreground">Comentários ({comments.length})</h2>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="O seu nome"
          className="rounded-2xl border border-border-subtle bg-surface p-3 text-sm text-foreground outline-none transition-colors focus:border-brand-500"
        />
        <div className="flex items-start gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva o seu comentário..."
            rows={3}
            className="flex-1 resize-none rounded-2xl border border-border-subtle bg-surface p-4 text-sm text-foreground outline-none transition-colors focus:border-brand-500"
          />
          <motion.button
            type="submit"
            disabled={status === "submitting"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Enviar comentário"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-50"
          >
            <HiOutlinePaperAirplane className="size-4" />
          </motion.button>
        </div>
        {status === "sent" ? (
          <p className="text-xs text-brand-600">Comentário enviado. Será publicado após moderação.</p>
        ) : null}
        {status === "error" ? (
          <p className="text-xs text-red-500">Não foi possível enviar o comentário. Tente novamente.</p>
        ) : null}
      </form>

      <div className="mt-8 space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-full">
              <Image src={comment.avatarUrl} alt={comment.authorName} fill sizes="40px" className="object-cover" />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
                <span className="text-xs text-foreground/40">{formatRelativeTime(comment.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/75">{comment.content}</p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/45 transition-colors hover:text-brand-600"
              >
                <HiOutlineHandThumbUp className="size-3.5" />
                {comment.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
