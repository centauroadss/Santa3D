import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const spacesEndpoint = 'https://nyc3.digitaloceanspaces.com';

const s3Client = new S3Client({
    endpoint: spacesEndpoint,
    forcePathStyle: false,
    region: 'nyc3',
    credentials: {
        accessKeyId: 'DO00VLJHG7EHCG2CN8DK',
        secretAccessKey: 'a0g4xYxdmx/6azhes5vZy3kVqZqGaeZGnfgCADhtQU4'
    }
});

async function testUpload() {
    try {
        console.log('Probando subida a copa2026-comprobantes...');
        await s3Client.send(new PutObjectCommand({
            Bucket: 'copa2026-comprobantes',
            Key: 'test-file.txt',
            Body: 'Contenido de prueba de conexion a DigitalOcean Spaces',
            ACL: 'private',
            ContentType: 'text/plain'
        }));
        console.log('✅ EXITO: Archivo de prueba subido a copa2026-comprobantes');

        console.log('Probando subida a copa2026-videos...');
        await s3Client.send(new PutObjectCommand({
            Bucket: 'copa2026-videos',
            Key: 'test-video.txt',
            Body: 'Contenido de prueba de conexion a DigitalOcean Spaces',
            ACL: 'private',
            ContentType: 'text/plain'
        }));
        console.log('✅ EXITO: Archivo de prueba subido a copa2026-videos');
        
    } catch (error) {
        console.error('❌ ERROR en la subida:', error);
    }
}

testUpload();
