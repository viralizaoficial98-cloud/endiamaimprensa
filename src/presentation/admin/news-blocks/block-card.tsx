"use client";

import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineMusicalNote, HiOutlinePhoto, HiOutlineTrash, HiOutlineVideoCamera } from "react-icons/hi2";
import { adminUploadFile } from "@/infrastructure/api/admin-http-client";
import { describeError } from "@/presentation/admin/news-form-helpers";
import { RichTextEditor } from "@/presentation/admin/rich-text-editor";
import { AudioBlockEditor } from "./audio-block-editor";
import { GalleryBlockEditor } from "./gallery-block-editor";
import type { NewsBlockInput } from "./types";
import { VideoBlockEditor } from "./video-block-editor";

const BLOCK_LABEL: Record<string, { label: string; icon: React.ReactNode }> = {
  image: { label: "Imagem", icon: <HiOutlinePhoto className="size-3.5" /> },
  gallery: { label: "Galeria", icon: <HiOutlinePhoto className="size-3.5" /> },
  video: { label: "Vídeo", icon: <HiOutlineVideoCamera className="size-3.5" /> },
  audio: { label: "Áudio", icon: <HiOutlineMusicalNote className="size-3.5" /> },
};

export function NewsBlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  block: NewsBlockInput;
  index: number;
  total: number;
  onChange: (block: NewsBlockInput) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const meta = BLOCK_LABEL[block.type];

  return (
    <div className="rounded-lg border border-border-subtle bg-surface">
      {block.type !== "richtext" ? (
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-muted px-3 py-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
            {meta?.icon}
            {meta?.label ?? block.type}
          </span>
          <BlockActions index={index} total={total} onMove={onMove} onRemove={onRemove} />
        </div>
      ) : null}

      <div className="p-3">
        {block.type === "richtext" ? (
          <div className="relative">
            <RichTextEditor value={block.content ?? ""} onChange={(html) => onChange({ ...block, content: html })} />
            <div className="mt-1.5 flex justify-end">
              <BlockActions index={index} total={total} onMove={onMove} onRemove={onRemove} compact />
            </div>
          </div>
        ) : block.type === "image" ? (
          <ImageBlockFields block={block} onChange={onChange} />
        ) : block.type === "gallery" ? (
          <GalleryBlockEditor block={block} onChange={onChange} />
        ) : block.type === "video" ? (
          <VideoBlockEditor block={block} onChange={onChange} />
        ) : block.type === "audio" ? (
          <AudioBlockEditor block={block} onChange={onChange} />
        ) : null}
      </div>
    </div>
  );
}

function BlockActions({
  index,
  total,
  onMove,
  onRemove,
  compact,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" disabled={index === 0} aria-label="Mover para cima" onClick={() => onMove(-1)} className="rounded p-1 text-foreground/50 hover:bg-surface disabled:opacity-30">
        <HiOutlineArrowUp className="size-3.5" />
      </button>
      <button type="button" disabled={index === total - 1} aria-label="Mover para baixo" onClick={() => onMove(1)} className="rounded p-1 text-foreground/50 hover:bg-surface disabled:opacity-30">
        <HiOutlineArrowDown className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className={compact ? "ml-1 text-[11px] font-medium text-red-500 hover:underline" : "ml-1 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"}
      >
        {compact ? "Remover bloco" : <HiOutlineTrash className="size-3.5" />}
      </button>
    </div>
  );
}

function ImageBlockFields({ block, onChange }: { block: NewsBlockInput; onChange: (block: NewsBlockInput) => void }) {
  return (
    <div className="space-y-2">
      <input
        placeholder="Texto alternativo desta imagem (obrigatório)"
        value={block.alt ?? ""}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
        className="w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
      <ImageBlockUpload block={block} onChange={onChange} />
      {block.content ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.content} alt={block.alt ?? ""} className="h-32 w-full max-w-sm rounded-md object-cover" />
      ) : null}
      <input
        placeholder="Legenda (opcional)"
        value={block.caption ?? ""}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        className="w-full rounded-md border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-brand-500"
      />
    </div>
  );
}

function ImageBlockUpload({ block, onChange }: { block: NewsBlockInput; onChange: (block: NewsBlockInput) => void }) {
  return (
    <input
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!block.alt?.trim()) {
          window.alert("Preencha o texto alternativo desta imagem antes de a carregar.");
          return;
        }
        try {
          const result = await adminUploadFile("news", file, block.alt);
          onChange({ ...block, content: result.url });
        } catch (err) {
          window.alert(describeError(err, "Não foi possível carregar a imagem do bloco."));
        }
      }}
      className="text-sm"
    />
  );
}
