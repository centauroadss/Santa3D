import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
/*
  CRITICAL LOGIC - DO NOT MODIFY WITHOUT APPROVAL
  1. This route MUST check Instagram via InstagramService to auto-validate entries (Condition 1).
  2. This route MUST save 'fps', 'resolution', and 'duration' to the database.
*/
import { videoConfirmSchema } from '@/lib/validations';
import { sendCertificateEmail } from '@/lib/emails/contestant';
import { StorageService } from '@/lib/storage';
import { InstagramService } from '@/lib/instagram';
export async function POST(request: NextRequest) {
  try {
    const participantId = request.headers.get('x-participant-id');
    if (!participantId) return NextResponse.json({ success: false, error: 'NO_AUTH' }, { status: 400 });
    const body = await request.json();
    const validatedData = videoConfirmSchema.parse(body);
    const video = await prisma.video.findFirst({
      where: { id: validatedData.videoId, participantId },
      include: { participant: true },
    });
    if (!video) return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
    // --- LOGICA DE VALIDACIÓN INSTAGRAM (Condición 1) ---
    let newStatus = 'PENDING_VALIDATION';
    let instagramUrl = null;
    let instagramLikes = 0;
    let lastSync = null;
    try {
      console.log(`🔍 Checking Instagram for Upload: ${video.participant.instagram}`);
      const taggedMedia = await InstagramService.getTaggedMedia();
      const cleanHandle = video.participant.instagram.toLowerCase().replace('@', '').trim();
      const match = taggedMedia.find(m => {
        const taggerName = (m.username || '').toLowerCase().replace('@', '').trim();
        return taggerName === cleanHandle;
      });
      if (match) {
        console.log('✅ Match Found on Upload! Auto-Validating.');
        newStatus = 'VALIDATED';
        instagramUrl = match.permalink;
        instagramLikes = match.like_count || 0;
        lastSync = new Date();
      }
    } catch (e) {
      console.warn('⚠️ Could not check Instagram during upload validation:', e);
    }
    // ----------------------------------------------------
    const updatedVideo = await prisma.video.update({
      where: { id: video.id },
      data: {
        status: newStatus as any,
        uploadedAt: new Date(),
        duration: validatedData.duration,
        resolution: validatedData.resolution,
        fps: validatedData.fps, // FIX: Saving FPS to DB
        instagramUrl: instagramUrl,
        instagramLikes: instagramLikes,
        lastInstagramSync: lastSync,
        validatedAt: newStatus === 'VALIDATED' ? new Date() : undefined
      },
    });
    // Enviar Email
    let signedUrlForEmail = '';
    try {
      signedUrlForEmail = await StorageService.getSignedVideoUrl(video.storageKey);
    } catch (e) {
      console.error('Error firmando URL para email:', e);
    }
    sendCertificateEmail(
      video.participant.email,
      {
        nombre: video.participant.nombre,
        apellido: video.participant.apellido || '',
        fileName: video.fileName,
        fileSize: video.fileSize ? (video.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Desconocido',
        submittedAt: new Date().toLocaleString('es-VE'),
        participantId: video.participant.id,
        videoUrl: signedUrlForEmail,
        metadata: {
          width: validatedData.width || 0,
          height: validatedData.height || 0,
          duration: validatedData.duration || 0,
          fps: validatedData.fps || 0,
          resolution: validatedData.resolution || '0x0'
        }
      }
    ).catch(err => console.error('Falló envío de certificado:', err));
    return NextResponse.json({
      success: true,
      data: { videoId: updatedVideo.id, status: newStatus }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'VALIDATION_ERROR', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'SERVER_ERROR' }, { status: 500 });
  }
}
