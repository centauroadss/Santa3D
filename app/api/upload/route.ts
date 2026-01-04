import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCertificateEmail } from '@/lib/emails/contestant';
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const participantId = formData.get('participantId') as string;
        const customFileName = formData.get('customFileName') as string;
        if (!file || !participantId) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }
        const fileName = customFileName || `SANTA3D_${participantId}_${Date.now()}_${file.name}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        // Importar dinámico para evitar ciclos si fuera necesario
        const { StorageService } = await import('@/lib/storage');
        const fileUrl = await StorageService.saveFile(buffer, fileName, file.type);
        // Enviar email (no bloqueante)
        try {
            const participant = await prisma.participant.findUnique({ where: { id: participantId } });
            if (participant) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                const dateStr = new Date().toLocaleString('es-VE');
                // [FIX] Validar límite para adjunto (35MB)
                const MAX_EMAIL_SIZE = 35 * 1024 * 1024;
                const attachBuffer = file.size <= MAX_EMAIL_SIZE ? buffer : undefined;
                
                if (!attachBuffer) {
                    console.warn(`Video muy grande (${sizeMB}) para adjuntar al email. Se enviará solo link.`);
                }
                await sendCertificateEmail(participant.email, {
                    nombre: participant.nombre,
                    apellido: participant.apellido || '',
                    instagram: participant.instagram || undefined,
                    fileName: fileName,
                    fileSize: sizeMB,
                    submittedAt: dateStr,
                    participantId: participant.id,
                    videoUrl: fileUrl,
                    videoBuffer: attachBuffer // [CRITICAL FIX] Pasar buffer para que se adjunte
                });
            }
        } catch (e) {
            console.error('Email error (non-critical):', e);
        }
        return NextResponse.json({ success: true, url: fileUrl });
    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
