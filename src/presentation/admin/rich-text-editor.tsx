"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
  HiOutlineBars3BottomLeft,
  HiOutlineBars3BottomRight,
  HiOutlineBars3,
  HiOutlineBars4,
  HiOutlineLink,
  HiOutlineLinkSlash,
  HiOutlineListBullet,
  HiOutlineMinus,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

/** WordPress-classic-inspired (functionally, not visually copied) rich text
 * editor for News content blocks. Built on Tiptap (ProseMirror) — the only
 * rich-text library in the project, chosen because it's the best-documented
 * option for React 19 + Next.js App Router with a clean SSR/hydration story
 * (immediatelyRender: false avoids the server/client markup mismatch Tiptap
 * is known for otherwise) and ships exactly the toolbar surface requested
 * (bold/italic/underline/strike, headings, lists, alignment, blockquote,
 * link, hr, undo/redo, sup/sub) via a handful of official extensions instead
 * of a bespoke contentEditable implementation. */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escreva aqui o conteúdo da notícia...",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Superscript,
      Subscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "tiptap-content" },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync when the parent swaps `value` from outside (e.g.
  // switching the PT/EN tab, or loading an existing article) — Tiptap only
  // owns its own keystrokes, not external value changes.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return <div className="min-h-[200px] rounded-lg border border-border-subtle bg-surface-muted animate-pulse" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <Toolbar editor={editor} />
      <div className="max-h-[480px] overflow-y-auto px-3.5 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link:", previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border-subtle bg-surface-muted px-2 py-1.5">
      <select
        value={
          editor.isActive("heading", { level: 2 })
            ? "h2"
            : editor.isActive("heading", { level: 3 })
              ? "h3"
              : editor.isActive("heading", { level: 4 })
                ? "h4"
                : "p"
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v.slice(1)) as 2 | 3 | 4 }).run();
        }}
        className="mr-1 rounded-md border border-border-subtle bg-surface px-2 py-1 text-xs"
      >
        <option value="p">Parágrafo</option>
        <option value="h2">Título H2</option>
        <option value="h3">Título H3</option>
        <option value="h4">Título H4</option>
      </select>

      <ToolbarDivider />
      <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
        <span className="text-sm font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
        <span className="text-sm italic">I</span>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado">
        <span className="text-sm underline">U</span>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Rasurado">
        <span className="text-sm line-through">S</span>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Sobrescrito">
        <span className="text-xs">x²</span>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()} title="Subscrito">
        <span className="text-xs">x₂</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Limpar formatação">
        <span className="text-xs">Tx</span>
      </ToolbarButton>

      <ToolbarDivider />
      <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista com marcadores">
        <HiOutlineListBullet className="size-4" />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
        <span className="text-xs font-semibold">1.</span>
      </ToolbarButton>

      <ToolbarDivider />
      <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Alinhar à esquerda">
        <HiOutlineBars3BottomLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centralizar">
        <HiOutlineBars3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Alinhar à direita">
        <HiOutlineBars3BottomRight className="size-4" />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justificar">
        <HiOutlineBars4 className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />
      <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
        <span className="text-sm">&ldquo;</span>
      </ToolbarButton>
      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Adicionar link">
        <HiOutlineLink className="size-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remover link" disabled={!editor.isActive("link")}>
        <HiOutlineLinkSlash className="size-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
        <HiOutlineMinus className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer">
        <HiOutlineArrowUturnLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer">
        <HiOutlineArrowUturnRight className="size-4" />
      </ToolbarButton>
    </div>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-border-subtle" />;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-surface disabled:opacity-30",
        active && "bg-brand-600/10 text-brand-700 dark:text-brand-400"
      )}
    >
      {children}
    </button>
  );
}
