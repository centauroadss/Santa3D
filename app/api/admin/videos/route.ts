import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { StorageService } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const videos = await prisma.video.findMany({
      include: { participant: true },
      orderBy: { uploadedAt: 'desc' },
    });
    const formattedVideos = await Promise.all(videos.map(async (video) => {
      let age = 'N/A';
      if (video.participant.fechaNacimiento) {
        const today = new Date();
        const birthDate = new Date(video.participant.fechaNacimiento);
        let ageNum = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            ageNum--;
        }
        age = ageNum.toString();
      }
      const metadata = video.validationResult as any || {};
      // GENERACIÓN DE URL FIRMADA
      // Esto garantiza acceso al video aunque el bucket sea privado
      let playUrl = null;
      if (video.storageKey) {
          try {
              // Generamos una URL fresca válida por 1 hora cada vez que se pide la lista
              playUrl = await StorageService.getSignedVideoUrl(video.storageKey);
          } catch (err) {
              console.error(`Error generating signed URL for video ${video.id}:`, err);
              playUrl = video.url;
          }
      }
      return {
        id: video.id,
        participantName: `${video.participant.nombre} ${video.participant.apellido}`,
        alias: video.participant.alias || '-',
        email: video.participant.email,
        instagram: video.participant.instagram,
        telefono: video.participant.telefono,
        fechaNacimiento: video.participant.fechaNacimiento,
        age: age,
        fileName: video.fileName,
        url: playUrl || video.url, // Usamos la firmada preferentemente
        status: video.status,
        uploadedAt: video.uploadedAt,
        fileSize: video.fileSize,
        format: video.format || metadata.format || '-',
        resolution: video.resolution || metadata.resolution || (metadata.width ? `${metadata.width}x${metadata.height}` : '-'),
        fps: video.fps || metadata.fps || metadata.frameRate || '-',
        duration: video.duration || metadata.duration || '-',
        codec: metadata.codec || '-'
      };
    }));
    return NextResponse.json({
      success: true,
      data: formattedVideos,
    });
  } catch (error: any) {
    console.error('Error fetching admin videos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
