export enum PhotoStatus  {
  PENDING = "pending",
  UPLOADED = "uploaded",
  UPLOAD_FAILED = "upload_failed",
}

export type Photo = {
  id: string;
  original_filename: string;
  s3_key: string;
  content_type: string;
  size_bytes: number | null;
  status: PhotoStatus;
  created_at: Date;
  updated_at: Date;
};

export type CreatePhotoRecordInput = {
  id: string;
  original_filename: string;
  s3Key: string;
  contentType: string;
  sizeBytes: number | null;
  status?: PhotoStatus;
};
