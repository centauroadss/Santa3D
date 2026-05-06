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

    const videos = await prisma.videoCopa2026.findMany({
      include: { 
          inscripcion: {
              include: { pago: true }
          } 
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedVideos = await Promise.all(videos.map(async (video) => {
      // Determinamos categoría individual del video si la inscripción es AMBAS
      let categoriaVideo = video.inscripcion.categoria;
      if (categoriaVideo === 'AMBAS') {
          if (video.rutaS3.includes('render/')) categoriaVideo = 'RENDER';
          else if (video.rutaS3.includes('ia/')) categoriaVideo = 'IA';
      }

      // GENERACIÓN DE URL FIRMADA (VIDEO)
      let playUrl = null;
      if (video.rutaS3) {
          try {
              playUrl = await StorageService.getSignedVideoUrl(video.rutaS3);
          } catch (err) {
              console.error(`Error generating signed URL for video ${video.id}:`, err);
          }
      }

      // GENERACIÓN DE URL FIRMADA (COMPROBANTE PAGO)
      let comprobanteUrl = null;
      if (video.inscripcion.pago?.comprobantePath) {
          try {
              comprobanteUrl = await StorageService.getSignedVideoUrl(video.inscripcion.pago.comprobantePath);
          } catch (err) {
              console.error(`Error generating signed URL for receipt ${video.inscripcion.id}:`, err);
          }
      }

      const warnings = video.warnings as any || [];

      return {
        id: video.id.toString(),
        participantName: `${video.inscripcion.nombre} ${video.inscripcion.apellido}`,
        email: video.inscripcion.email,
        telefono: video.inscripcion.telefono,
        categoria: categoriaVideo,
        categoriaInscripcion: video.inscripcion.categoria,
        fileName: video.nombreArchivo,
        url: playUrl,
        comprobanteUrl: comprobanteUrl,
        status: video.estatus,
        uploadedAt: video.createdAt.toISOString(),
        fileSize: Number(video.tamanoBytes),
        format: video.formato || '-',
        resolution: video.resolucion || '-',
        fps: video.fps || '-',
        duration: video.duracionSeg || '-',
        warnings: warnings
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
