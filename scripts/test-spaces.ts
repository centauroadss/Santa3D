import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const client = new S3Client({
    region: 'nyc3', // default or extract from endpoint
    endpoint: process.env.DO_SPACES_ENDPOINT,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
    }
});

async function main() {
    const buckets = [
        process.env.DO_SPACES_BUCKET_COMPROBANTES,
        process.env.DO_SPACES_BUCKET_VIDEOS
    ];

    console.log(`Endpoint: ${process.env.DO_SPACES_ENDPOINT}`);

    for (const bucket of buckets) {
        if (!bucket) {
            console.error('Bucket not defined in env.');
            continue;
        }
        console.log(`Uploading to bucket: ${bucket}`);
        try {
            const cmd = new PutObjectCommand({
                Bucket: bucket,
                Key: 'test-upload.txt',
                Body: 'Test file from Copa2026',
                ACL: 'private'
            });
            await client.send(cmd);
            console.log(`✅ Upload OK for ${bucket}`);
        } catch (e) {
            console.error(`❌ Error uploading to ${bucket}:`, e);
        }
    }
}

main();
