import { pool } from "../db/db";

import type {
  CreatePhotoRecordInput,
  Photo,
  PhotoStatus,
} from "../types/photo";

export async function findAllPhotos(): Promise<Photo[]> {
  const query = "SELECT * FROM photos ORDER BY updated_at DESC";
  const result = await pool.query(query);
  return result.rows;
}

export async function createPhotoRecord(
  input: CreatePhotoRecordInput,
): Promise<Photo> {
  const query = `
    INSERT INTO photos (id, original_filename, s3_key, content_type, size_bytes, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    input.id,
    input.original_filename,
    input.s3Key,
    input.contentType,
    input.sizeBytes,
    input.status || "pending",
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function updatePhotoStatus(
  photoId: string,
  status: PhotoStatus,
): Promise<Photo> {
  const query = `
    UPDATE photos
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [photoId, status]);

  if (!result.rows[0]) {
    throw new Error(`Photo record not found for id ${photoId}`);
  }

  return result.rows[0];
}
