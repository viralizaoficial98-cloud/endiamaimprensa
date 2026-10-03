import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export interface ProcessedImage {
  filename: string;
  thumbnailFilename: string;
}

/** Windows can transiently hold a just-closed file handle (AV scan, delayed libuv release); retry briefly instead of failing the upload. */
async function withRetry(fn: () => Promise<void>, attempts = 5, delayMs = 100): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await fn();
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (i === attempts - 1 || (code !== "EPERM" && code !== "EBUSY")) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Converts an uploaded raster image to WebP (max 1920px wide) plus a 400px-wide
 * thumbnail, then removes the original upload to save disk space.
 */
export async function processImage(filePath: string): Promise<ProcessedImage> {
  const dir = path.dirname(filePath);

  // Output names are always freshly generated (never derived from the input's own name):
  // when the source upload is already "<name>.webp", sharp keeps its read handle on that
  // path open past toBuffer() (released only on GC), so writing/renaming back onto that
  // same path can hit a transient Windows EPERM. A fresh name sidesteps the collision
  // entirely instead of racing the handle release.
  const uniqueId = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  const mainName = `${uniqueId}.webp`;
  const thumbName = `${uniqueId}-thumb.webp`;
  const mainPath = path.join(dir, mainName);
  const thumbPath = path.join(dir, thumbName);

  const image = sharp(filePath).rotate();

  const mainBuffer = await image.clone().resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const thumbBuffer = await image.clone().resize({ width: 400, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();

  await fs.writeFile(mainPath, mainBuffer);
  await fs.writeFile(thumbPath, thumbBuffer);

  if (path.resolve(filePath) !== path.resolve(mainPath)) {
    await withRetry(() => fs.unlink(filePath)).catch(() => undefined);
  }

  return { filename: mainName, thumbnailFilename: thumbName };
}
