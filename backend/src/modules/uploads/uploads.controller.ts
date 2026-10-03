import path from "node:path";
import fs from "node:fs/promises";
import type { Request, Response } from "express";
import { asyncHandler } from "../../common/async-handler";
import { created, ok } from "../../common/api-response";
import { AppError } from "../../common/app-error";
import { recordAudit } from "../audit/audit.service";
import { isImageMimeType, publicUrlFor, UPLOAD_ROOT, type UploadFolder } from "./upload.config";
import { processImage } from "./image.processor";

export const uploadFileHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw AppError.badRequest("Nenhum ficheiro foi enviado.");
  const folder = req.params.folder as UploadFolder;
  const altText = typeof req.body.altText === "string" ? req.body.altText.trim() : "";

  if (isImageMimeType(req.file.mimetype) && folder !== "documents" && folder !== "clippings" && !altText) {
    await fs.unlink(req.file.path).catch(() => undefined);
    throw AppError.badRequest("O texto alternativo (alt) é obrigatório para imagens editoriais.");
  }

  let filename = req.file.filename;
  let thumbnailUrl: string | undefined;

  if (isImageMimeType(req.file.mimetype)) {
    const processed = await processImage(req.file.path);
    filename = processed.filename;
    thumbnailUrl = publicUrlFor(folder, processed.thumbnailFilename);
  }

  const url = publicUrlFor(folder, filename);

  await recordAudit({
    req,
    action: "UPLOAD",
    module: "uploads",
    entity: "File",
    entityId: filename,
    newData: { folder, url, originalName: req.file.originalname, size: req.file.size },
  });

  created(res, {
    url,
    thumbnailUrl,
    filename,
    folder,
    altText: altText || undefined,
    mimeType: req.file.mimetype,
    size: req.file.size,
  }, "Ficheiro carregado com sucesso.");
});

export const deleteFileHandler = asyncHandler(async (req: Request, res: Response) => {
  const folder = req.params.folder as UploadFolder;
  const { filename } = req.params;

  const safeName = path.basename(filename);
  const filePath = path.join(UPLOAD_ROOT, folder, safeName);
  if (!filePath.startsWith(UPLOAD_ROOT)) throw AppError.badRequest("Caminho de ficheiro inválido.");

  await fs.unlink(filePath).catch(() => undefined);
  const thumbPath = filePath.replace(/\.webp$/, "-thumb.webp");
  await fs.unlink(thumbPath).catch(() => undefined);

  await recordAudit({ req, action: "DELETE", module: "uploads", entity: "File", entityId: safeName });

  ok(res, null, "Ficheiro removido com sucesso.");
});
