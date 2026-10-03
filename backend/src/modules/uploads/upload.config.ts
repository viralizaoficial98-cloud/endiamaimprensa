import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../../config/env";
import { AppError } from "../../common/app-error";

export const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "uploads");

export const UPLOAD_FOLDERS = [
  "news",
  "banners",
  "users",
  "galleries",
  "videos",
  "podcasts",
  "audios",
  "events",
  "interviews",
  "documents",
  "partners",
  "clippings",
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** Belt-and-braces alongside the .gitkeep placeholders: multer does not
 * create missing destination directories itself, and a deploy step (fresh
 * clone, archive extraction, ...) could in principle still land without them.
 * Called once at startup — cheap, idempotent, never touches existing files. */
export function ensureUploadFoldersExist(): void {
  for (const folder of UPLOAD_FOLDERS) {
    fs.mkdirSync(path.join(UPLOAD_ROOT, folder), { recursive: true });
  }
}

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const AUDIO_MIME_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/m4a"]);
const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
]);

const ALLOWED_MIME_TYPES = new Set([...IMAGE_MIME_TYPES, ...AUDIO_MIME_TYPES, ...VIDEO_MIME_TYPES, ...DOCUMENT_MIME_TYPES]);
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".mp4",
  ".webm",
  ".mov",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
]);

export function isImageMimeType(mime: string): boolean {
  return IMAGE_MIME_TYPES.has(mime);
}

for (const folder of UPLOAD_FOLDERS) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, folder), { recursive: true });
}

function safeFolder(value: string): UploadFolder {
  if (!UPLOAD_FOLDERS.includes(value as UploadFolder)) {
    throw AppError.badRequest(`Pasta de upload inválida: ${value}`);
  }
  return value as UploadFolder;
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    try {
      const folder = safeFolder(req.params.folder);
      cb(null, path.join(UPLOAD_ROOT, folder));
    } catch (err) {
      cb(err as Error, "");
    }
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.uploadMaxSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error("Tipo de ficheiro não permitido."));
      return;
    }
    cb(null, true);
  },
});

/** Relative path only — never bakes the backend's own host/IP (env.apiBaseUrl)
 * into stored data. The frontend's resolveMediaUrl() already prefixes relative
 * /uploads paths with its own NEXT_PUBLIC_BACKEND_URL at render time, so the
 * same stored value keeps working across local/cPanel/any future domain
 * without touching the database. Rows saved before this change still have the
 * old absolute URL baked in — resolveMediaUrl() passes those through
 * unchanged, so existing images never break. */
export function publicUrlFor(folder: UploadFolder, filename: string): string {
  return `/uploads/${folder}/${filename}`;
}
