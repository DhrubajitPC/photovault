export type Photo = {
  id: string;
  original_filename: string;
  s3_key: string;
  content_bytes: string;
  size_bytes: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
};

export type CreatePhotoRecordInput = {
  id: string;
  original_filename: string;
  s3Key: string;
  contentType: string;
  sizeBytes: number | null;
  status?: string;
};
