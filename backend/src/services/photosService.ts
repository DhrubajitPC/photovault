import { randomUUID } from "node:crypto";
import path from "node:path";
import { PhotoUploadError } from "../errors/PhotoUploadError";
import {
  createPhotoRecord,
  findAllPhotos,
} from "../repositories/photosRepository";
import { uploadPhotoToS3 } from "./s3";

import type { Photo } from "../types/photo";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
]);

export async function listPhotos(): Promise<Photo[]> {
  return findAllPhotos();
}

export async function createTestPhoto(): Promise<Photo> {
  const photoId = randomUUID();

  return createPhotoRecord({
    id: photoId,
    original_filename: "sample-photo.jpg",
    s3Key: `photos/${photoId}-sample-photo.jpg`,
    contentType: "image/jpeg",
    sizeBytes: 123456,
    status: "uploaded",
  });
}

export async function uploadPhoto(file: Express.Multer.File): Promise<Photo> {
  validatePhotoFile(file);

  const photoId = randomUUID();
  const s3Key = buildPhotoS3Key(photoId, file.originalname);

  await uploadPhotoToS3({
    key: s3Key,
    body: file.buffer,
    contentType: file.mimetype,
  });

  return createPhotoRecord({
    id: photoId,
    original_filename: file.originalname,
    s3Key,
    contentType: file.mimetype,
    sizeBytes: file.size,
    status: "uploaded",
  });
}

function validatePhotoFile(file: Express.Multer.File): void {
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new PhotoUploadError(
      "Unsupported file type. Only JPEG, PNG, GIF, WebP, BMP, and TIFF are allowed.",
    );
  }
}

function buildPhotoS3Key(photoId: string, originalName: string): string {
  const fileExtension = path.extname(originalName);
  const sanitizedBaseName = path
    .basename(originalName, fileExtension)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .toLowerCase();

  const safeBaseName = sanitizedBaseName || "photo";
  const safeFileName = `${safeBaseName}${fileExtension.toLowerCase()}`;

  return `photos/${photoId}-${safeFileName}`;
}
