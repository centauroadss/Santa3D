const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'santa3d-assets';
const REGION = process.env.AWS_REGION || 'us-east-1';
const rawEndpoint = process.env.AWS_ENDPOINT || '';
const cleanEndpoint = rawEndpoint.includes(`//${S3_BUCKET}.`) 
  ? rawEndpoint.replace(`//${S3_BUCKET}.`, '//') 
  : rawEndpoint;

console.log("Endpoint:", cleanEndpoint);

const s3Client = new S3Client({
  region: REGION,
  endpoint: cleanEndpoint,
  forcePathStyle: false,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function run() {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: 'test.mp4',
    ContentType: 'video/mp4',
    ACL: 'public-read',
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  console.log("Presigned URL:", url);
}

run();
