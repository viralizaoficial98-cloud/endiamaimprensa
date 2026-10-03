import { Router } from "express";
import { authenticate } from "../../guards/authenticate";
import { authorize } from "../../guards/authorize";
import { upload } from "./upload.config";
import { deleteFileHandler, uploadFileHandler } from "./uploads.controller";

export const uploadsRouter = Router();

/**
 * @openapi
 * /admin/uploads/{folder}:
 *   post:
 *     tags: [Uploads]
 *     summary: Carrega um ficheiro (imagem, vídeo, áudio ou documento) para a pasta indicada
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: folder
 *         required: true
 *         schema: { type: string, enum: [news, banners, users, galleries, videos, podcasts, events, interviews, documents, partners] }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               altText: { type: string }
 *     responses:
 *       201: { description: Ficheiro carregado com sucesso }
 */
uploadsRouter.post(
  "/:folder",
  authenticate,
  authorize("uploads.create", "news.create", "news.update"),
  upload.single("file"),
  uploadFileHandler
);

uploadsRouter.delete("/:folder/:filename", authenticate, authorize("uploads.delete", "news.update"), deleteFileHandler);
