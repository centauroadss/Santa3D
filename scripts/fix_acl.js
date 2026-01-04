
const { S3Client, PutObjectAclCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
    region: 'sfo3',
    endpoint: 'https://sfo3.digitaloceanspaces.com',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }
});

async function fixAcl() {
    const bucket = process.env.AWS_S3_BUCKET || 'santa3d';
    // Key from the failing video in verification
    const key = 'videos/cmjndd5uk000mjf6ms6gwkm4m/65fef95b-9ab8-4893-a83b-14adee6dcac3.mp4';

    console.log(`Attempting to set ACL=public-read for ${bucket}/${key}`);
    try {
        const cmd = new PutObjectAclCommand({
            Bucket: bucket,
            Key: key,
            ACL: 'public-read'
        });
        await client.send(cmd);
        console.log('✅ ACL Updated to public-read');
    } catch (e) {
        console.error('❌ Error fixing ACL:', e);
    }
}

fixAcl();
