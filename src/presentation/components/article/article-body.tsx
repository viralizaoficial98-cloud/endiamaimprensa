import Image from "next/image";
import type { NewsBlock } from "@/domain/entities";
import { Reveal } from "@/presentation/components/ui/reveal";
import { AudioBlock } from "./blocks/audio-block";
import { GalleryBlock } from "./blocks/gallery-block";
import { RichTextBlock } from "./blocks/rich-text-block";
import { VideoBlock } from "./blocks/video-block";

export function ArticleBody({ blocks, articleTitle = "" }: { blocks: NewsBlock[]; articleTitle?: string }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.type === "richtext") {
          return (
            <Reveal key={index}>
              <RichTextBlock html={block.content ?? ""} />
            </Reveal>
          );
        }
        if (block.type === "gallery") {
          return (
            <Reveal key={index}>
              <GalleryBlock images={block.images ?? []} articleTitle={articleTitle} />
            </Reveal>
          );
        }
        if (block.type === "video") {
          return (
            <Reveal key={index}>
              <VideoBlock block={block} />
            </Reveal>
          );
        }
        if (block.type === "audio") {
          return (
            <Reveal key={index}>
              <AudioBlock block={block} />
            </Reveal>
          );
        }
        if (block.type === "quote") {
          return (
            <Reveal key={index} as="article">
              <blockquote className="border-l-4 border-gold-500 py-2 pl-6 font-heading text-xl italic leading-relaxed text-foreground/85 sm:text-2xl">
                {block.content}
                {block.caption ? (
                  <cite className="mt-3 block text-sm not-italic font-sans font-medium text-foreground/50">
                    — {block.caption}
                  </cite>
                ) : null}
              </blockquote>
            </Reveal>
          );
        }
        if (block.type === "heading") {
          return (
            <Reveal key={index}>
              <h2 className="font-heading text-2xl font-medium text-foreground">{block.content}</h2>
            </Reveal>
          );
        }
        if (block.type === "image") {
          if (!block.content) return null;
          return (
            <Reveal key={index}>
              <figure>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                  <Image
                    src={block.content}
                    alt={block.alt ?? ""}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                </div>
                {block.caption ? (
                  <figcaption className="mt-2.5 text-center text-sm text-foreground/50">{block.caption}</figcaption>
                ) : null}
              </figure>
            </Reveal>
          );
        }
        return (
          <Reveal key={index}>
            <p className="text-base leading-relaxed text-foreground/80 sm:text-lg">{block.content}</p>
          </Reveal>
        );
      })}
    </div>
  );
}
