require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

async function testS3() {
  const S3_BUCKET = process.env.AWS_S3_BUCKET || 'santa3d';
  const REGION = process.env.AWS_REGION || 'sfo3';
  
  const rawEndpoint = process.env.AWS_ENDPOINT || '';
  const cleanEndpoint = rawEndpoint.includes(`//${S3_BUCKET}.`) 
    ? rawEndpoint.replace(`//${S3_BUCKET}.`, '//') 
    : rawEndpoint;

  const s3Client = new S3Client({
    region: REGION,
    endpoint: cleanEndpoint,
    forcePathStyle: false,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  const svgImage = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">' +
    '<rect width="400" height="200" fill="#4CAF50"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24" font-family="Arial">¡PRUEBA EXITOSA - DIGITALOCEAN!</text>' +
    '</svg>'
  );

  const key = 'perfiles_2026/prueba_exitosa.svg';

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: svgImage,
    ContentType: 'image/svg+xml',
    ACL: 'public-read',
  });

  try {
    console.log("Subiendo imagen de prueba a DigitalOcean Spaces...");
    await s3Client.send(command);
    console.log("¡Éxito! La imagen se subió a S3.");
    console.log(`URL de la imagen: ${process.env.AWS_ENDPOINT}/${S3_BUCKET}/${key}`);
  } catch (e) {
    console.error("Error al subir:", e);
  }
}

testS3();
