require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false, // DigitalOcean Spaces typically doesn't need this, but we'll see
});

async function testUpload() {
    try {
        console.log('Generating presigned URL...');
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `test-upload-${Date.now()}.txt`,
            ContentType: 'text/plain',
            ACL: 'public-read'
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        console.log('Presigned URL:', uploadUrl);

        console.log('Uploading file...');
        const response = await axios.put(uploadUrl, 'Hello World', {
            headers: {
                'Content-Type': 'text/plain',
                'x-amz-acl': 'public-read'
            }
        });
        
        console.log('Upload success! Status:', response.status);
    } catch (err) {
        console.error('Upload failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

testUpload();
