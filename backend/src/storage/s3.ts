import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from '../config/aws';

// Configuration-only S3 client. No upload flow implemented in this pass.
export const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: awsConfig.credentials,
});

export interface PresignParams {
  key: string;
  contentType: string;
  expiresIn?: number;
}

export async function presignPutUrl({ key, contentType, expiresIn = 900 }: PresignParams): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: awsConfig.bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3Client, cmd, { expiresIn });
}

export async function presignGetUrl(key: string, expiresIn = 900): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: awsConfig.bucket, Key: key });
  return getSignedUrl(s3Client, cmd, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: awsConfig.bucket, Key: key }));
}

export const storagePaths = awsConfig.paths;
