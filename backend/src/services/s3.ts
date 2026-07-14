import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import config from "../config";

const s3Client = new S3Client({
  region: config.aws.region,
});

export async function uploadPhotoToS3(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const { key, body, contentType } = params;
  const command = new PutObjectCommand({
    Bucket: config.aws.bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
}

export async function deletePhotoFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.aws.bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
