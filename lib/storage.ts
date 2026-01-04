
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const S3_BUCKET = process.env.AWS_S3_BUCKET || 'santa3d-assets';
const REGION = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({
  region: REGION,
  endpoint: process.env.AWS_ENDPOINT, // TRUST THE BACKUP: Use raw endpoint even if 'dirty'
  forcePathStyle: false, // LOGIC: Use Virtual Host style to match DO SFO3 requirements
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const StorageService = {
  generateKey: (originalName: string, prefix = 'uploads') => {
    const ext = path.extname(originalName);
    return `${prefix}/${uuidv4()}${ext}`;
  },
  getUrl: async (key: string) => {
    if (STORAGE_PROVIDER === 'local') return `/uploads/${key}`;

    // BACKUP LOGIC: Use raw endpoint. This creates double-bucket URLs if endpoint has bucket.
    // Preserving this behavior as it matches "Working State" history.
    if (process.env.AWS_ENDPOINT && process.env.AWS_ENDPOINT.includes('digitaloceanspaces')) {
      return `${process.env.AWS_ENDPOINT}/${S3_BUCKET}/${key}`;
    }

    return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  },
  getUploadUrl: async (key: string, contentType: string) => {
    if (STORAGE_PROVIDER === 'local') return null;
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  },
  getSignedVideoUrl: async (key: string) => {
    if (STORAGE_PROVIDER === 'local') return `/uploads/${key}`;
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  },
  saveFile: async (file: Buffer, key: string, contentType: string) => {
    if (STORAGE_PROVIDER === 'local') {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, key.replace('uploads/', ''));
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(filePath, file);
      return `/uploads/${key.replace('uploads/', '')}`;
    }

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    if (process.env.AWS_ENDPOINT && process.env.AWS_ENDPOINT.includes('digitaloceanspaces')) {
      return `${process.env.AWS_ENDPOINT}/${S3_BUCKET}/${key}`;
    }

    return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  }
};

export function generateVideoKey(participantId: string, fileName: string) {
  const ext = path.extname(fileName);
  return `videos/${participantId}/${uuidv4()}${ext}`;
}

export async function generatePresignedUploadUrl(key: string, contentType: string, expiresIn = 3600) {
  return await StorageService.getUploadUrl(key, contentType);
}

export function getPublicVideoUrl(key: string) {
  return StorageService.getUrl(key);
}
