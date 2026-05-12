import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '@/lib/storage';

const prisma = new PrismaClient();

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

        const fileExt = fileName.split('.').pop() || 'mp4';
        const safeCategory = fileCategory || inscripcion.categoria;
        const key = `videos/${safeCategory}/${inscripcion.id}_${uuidv4()}.${fileExt}`;

        // Generar la URL de subida usando el StorageService (que ya tiene las credenciales correctas)
        const uploadUrl = await StorageService.getUploadUrl(key, fileType);
        
        // Obtener la URL pública final
        const videoUrl = await StorageService.getUrl(key);

        return NextResponse.json({ uploadUrl, videoUrl });

    } catch (error) {
        console.error('Error generating presigned url:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
