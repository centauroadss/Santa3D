import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const s3Client = new S3Client({
    endpoint: 'https://nyc3.digitaloceanspaces.com', // DO Spaces
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
    }
});

export async function POST(req: Request) {
    try {
        const { tokenVideo, fileName, fileType, fileCategory } = await req.json();

        // Validate Token
        const inscripcion = await prisma.inscripcionCopa2026.findUnique({
            where: { tokenVideo }
        });

        if (!inscripcion || (inscripcion.tokenExpiry && new Date() > inscripcion.tokenExpiry)) {
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
        }

        if (inscripcion.estatusInscripcion === 'COMPLETADO') {
            return NextResponse.json({ error: 'El video ya fue cargado' }, { status: 400 });
        }

        const bucket = process.env.DO_SPACES_BUCKET_VIDEOS || 'copa2026-videos';
        const fileExt = fileName.split('.').pop() || 'mp4';
        const safeCategory = fileCategory || inscripcion.categoria;
        const key = `videos/${safeCategory}/${inscripcion.id}_${uuidv4()}.${fileExt}`;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: fileType,
            ACL: 'public-read'
        });

        // URL expira en 15 min
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
        
        // La URL final para acceder al archivo (siendo public-read)
        const videoUrl = `https://${bucket}.nyc3.digitaloceanspaces.com/${key}`;

        return NextResponse.json({ uploadUrl, videoUrl });

    } catch (error) {
        console.error('Error generating presigned url:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
