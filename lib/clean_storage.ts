import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// CONSTANTS (Hardcoded or Env - aiming for correctness)
const REGION = 'sfo3';
const BUCKET = 'santa3d';
// Endpoint: Must NOT contain bucket name for SDK
const ENDPOINT = 'https://sfo3.digitaloceanspaces.com';

// 1. Initialize Client
// DigitalOcean Spaces in SFO3 requires Virtual Host Style for best compatibility
// ForcePathStyle = FALSE (Correct for modern Spaces)
const s3Client = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    forcePathStyle: false,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '', // We rely on the verified ENV
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export class CleanStorageService {
    /**
     * Generates a Signed URL for video playback.
     * This ignores any previous "Legacy" logic.
     */
    static async getSignedUrl(key: string): Promise<string> {
        try {
            // Ensure Key does not have leading slash
            const cleanKey = key.startsWith('/') ? key.slice(1) : key;
            const command = new GetObjectCommand({
                Bucket: BUCKET,
                Key: cleanKey,
            });

            // Generate signed URL valid for 1 hour
            // This bypasses Public/Private ACLs if Keys have permission.
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return url;
        } catch (error) {
            console.error('CleanStorageService Error:', error);
            throw error;
        }
    }

    /**
     * Lists files in the bucket.
     */
    static async listFiles(limit = 20): Promise<any[]> {
        try {
            const command = new ListObjectsV2Command({
                Bucket: BUCKET,
                MaxKeys: limit,
            });
            const response = await s3Client.send(command);
            return response.Contents || [];
        } catch (error) {
            console.error('CleanStorageService List Error:', error);
            // Fallback: Return empty list instead of crashing, to verify at least the Page loads
            return [];
        }
    }
}
