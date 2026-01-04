
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// BACKUP LOGIC MIRROR
// Endpoint HAS bucket name. Force Path Style is TRUE.
const client = new S3Client({
    region: 'sfo3',
    endpoint: 'https://santa3d.sfo3.digitaloceanspaces.com',
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }
});

async function list() {
    const bucket = process.env.AWS_S3_BUCKET || 'santa3d';
    console.log(`Listing bucket: ${bucket} (Backup Logic)`);
    try {
        const cmd = new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 });
        const res = await client.send(cmd);
        console.log('Contents:', res.Contents ? res.Contents.map(c => c.Key) : 'Empty');
    } catch (e) {
        console.error('Error listing:', e);
    }
}

list();
