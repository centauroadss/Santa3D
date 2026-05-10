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

    const inscripciones = await prisma.inscripcionCopa2026.findMany({
      include: { 
          pago: true,
          videos: true
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedInscripciones = await Promise.all(inscripciones.map(async (insc) => {
      // Foto Perfil
      let fotoPerfilUrl = null;
      if (insc.fotoPerfilPath) {
          try {
              fotoPerfilUrl = await StorageService.getSignedVideoUrl(insc.fotoPerfilPath);
          } catch (err) {}
      }

      // Comprobante Pago
      let comprobanteUrl = null;
      if (insc.pago?.comprobantePath) {
          try {
              comprobanteUrl = await StorageService.getSignedVideoUrl(insc.pago.comprobantePath);
          } catch (err) {}
      }

      const formattedVideos = await Promise.all(insc.videos.map(async (v) => {
          let playUrl = null;
          if (v.rutaS3) {
              try {
                  playUrl = await StorageService.getSignedVideoUrl(v.rutaS3);
              } catch (err) {}
          }
          
          let categoriaVideo = insc.categoria;
          if (categoriaVideo === 'AMBAS') {
              if (v.rutaS3.includes('render/')) categoriaVideo = 'RENDER';
              else if (v.rutaS3.includes('ia/')) categoriaVideo = 'IA';
          }

          return {
              id: v.id.toString(),
              fileName: v.nombreArchivo,
              url: playUrl,
              categoria: categoriaVideo,
              status: v.estatus,
              uploadedAt: v.createdAt.toISOString(),
              fileSize: Number(v.tamanoBytes),
              format: v.formato || '-',
              resolution: v.resolucion || '-',
              fps: v.fps || '-',
              duration: v.duracionSeg || '-',
              warnings: v.warnings as any || []
          };
      }));

      return {
        id: insc.id.toString(),
        participantName: `${insc.nombre} ${insc.apellido}`,
        email: insc.email,
        telefono: insc.telefono,
        categoria: insc.categoria,
        estatusInscripcion: insc.estatusInscripcion,
        createdAt: insc.createdAt.toISOString(),
        fotoPerfilUrl: fotoPerfilUrl,
        comprobanteUrl: comprobanteUrl,
        videos: formattedVideos
      };
    }));

    return NextResponse.json({
      success: true,
      data: formattedInscripciones,
    });
  } catch (error: any) {
    console.error('Error fetching admin inscripciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
