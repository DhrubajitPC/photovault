import { randomUUID } from "node:crypto";
import path from "node:path";
import { PhotoUploadError } from "../errors/PhotoUploadError";
import {
  createPhotoRecord,
  findAllPhotos,
  updatePhotoStatus,
} from "../repositories/photosRepository";
import { uploadPhotoToS3 } from "./s3";
import { logger } from "../utils/logger";

import { PhotoStatus, type Photo } from "../types/photo";

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

export async function uploadPhoto(file: Express.Multer.File): Promise<Photo> {
  validatePhotoFile(file);

  const photoId = randomUUID();
  const s3Key = buildPhotoS3Key(photoId, file.originalname);

  logger.info("photo.upload.started", "Photo upload workflow started", {
    photoId,
    s3Key,
    originalFilename: file.originalname,
    contentType: file.mimetype,
    sizeBytes: file.size,
  });

  let pendingPhoto: Photo;

  try {
    pendingPhoto = await createPendingPhotoRecord({
      photoId,
      s3Key,
      file,
    });

    logger.info(
      "photo.upload.record_created",
      "Pending photo record created before S3 upload",
      {
        photoId,
        s3Key,
        status: pendingPhoto.status,
      },
    );
  } catch (error) {
    logger.error(
      "photo.upload.record_create_failed",
      "Failed to create pending photo record before S3 upload",
      {
        photoId,
        s3Key,
        s3ObjectUploaded: false,
        retryable: false,
        retryReason:
          "No durable photo record exists and the original file bytes are only available during this request.",
        error: logger.serializeError(error),
      },
    );

    throw error;
  }

  try {
    await uploadPhotoToS3({
      key: s3Key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    logger.info("photo.upload.s3_uploaded", "Photo object uploaded to S3", {
      photoId,
      s3Key,
      status: pendingPhoto.status,
    });
  } catch (error) {
    logger.error("photo.upload.s3_upload_failed", "Photo upload to S3 failed", {
      photoId,
      s3Key,
      status: pendingPhoto.status,
      s3ObjectUploaded: false,
      retryable: false,
      retryAction: "client_reupload_required",
      retryReason:
        "The original file bytes are not persisted after request failure, so an automated retry job cannot replay this upload yet.",
      error: logger.serializeError(error),
    });

    await markPhotoUploadFailed(photoId, s3Key, error);
    throw error;
  }

  try {
    const uploadedPhoto = await updatePhotoStatus(photoId, PhotoStatus.UPLOADED);

    logger.info(
      "photo.upload.status_updated",
      "Photo record marked as uploaded",
      {
        photoId,
        s3Key,
        previousStatus: pendingPhoto.status,
        status: uploadedPhoto.status,
      },
    );

    return uploadedPhoto;
  } catch (error) {
    logger.error(
      "photo.upload.mark_uploaded_failed",
      "Photo uploaded to S3 but DB status update failed",
      {
        photoId,
        s3Key,
        currentStatus: pendingPhoto.status,
        desiredStatus: "uploaded",
        s3ObjectUploaded: true,
        retryable: true,
        retryAction: "mark_photo_uploaded",
        retryLookup: { photoId, s3Key },
        error: logger.serializeError(error),
      },
    );

    throw error;
  }
}

async function createPendingPhotoRecord(params: {
  photoId: string;
  s3Key: string;
  file: Express.Multer.File;
}): Promise<Photo> {
  const { photoId, s3Key, file } = params;

  return createPhotoRecord({
    id: photoId,
    original_filename: file.originalname,
    s3Key,
    contentType: file.mimetype,
    sizeBytes: file.size,
    status: PhotoStatus.PENDING
  });
}

async function markPhotoUploadFailed(
  photoId: string,
  s3Key: string,
  originalError: unknown,
): Promise<void> {
  try {
    const failedPhoto = await updatePhotoStatus(photoId, PhotoStatus.UPLOAD_FAILED);

    logger.warn(
      "photo.upload.status_marked_failed",
      "Photo record marked as upload_failed after S3 upload failure",
      {
        photoId,
        s3Key,
        status: failedPhoto.status,
        originalError: logger.serializeError(originalError),
      },
    );
  } catch (error) {
    logger.error(
      "photo.upload.mark_failed_failed",
      "Failed to mark photo record as upload_failed after S3 upload failure",
      {
        photoId,
        s3Key,
        currentStatus: PhotoStatus.PENDING,
        desiredStatus: PhotoStatus.UPLOAD_FAILED,
        retryable: true,
        retryAction: "mark_photo_upload_failed",
        retryLookup: { photoId, s3Key },
        originalError: logger.serializeError(originalError),
        error: logger.serializeError(error),
      },
    );
  }
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
