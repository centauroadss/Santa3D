const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    endpoint: 'https://nyc3.digitaloceanspaces.com',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
    }
});

async function run() {
    const command = new PutObjectCommand({
        Bucket: 'copa2026-videos',
        Key: 'test.mp4',
        ContentType: 'video/mp4',
        ACL: 'public-read'
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    console.log(url);
}

run();
