
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const client = new S3Client({
    region: 'sfo3',
    endpoint: 'https://sfo3.digitaloceanspaces.com', // Clean endpoint
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }
});

async function list() {
    const bucket = process.env.AWS_S3_BUCKET || 'santa3d';
    console.log(`Listing bucket: ${bucket}`);
    try {
        const cmd = new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 });
        const res = await client.send(cmd);
        console.log('Contents:', res.Contents?.map(c => c.Key));
    } catch (e) {
        console.error('Error listing:', e);
    }
}

list();
