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
              fotoPerfilUrl = await StorageService.getUrl(insc.fotoPerfilPath);
          } catch (err) {}
      }

      // Comprobante Pago
      let comprobanteUrl = null;
      if (insc.pago?.comprobantePath) {
          try {
              comprobanteUrl = await StorageService.getUrl(insc.pago.comprobantePath);
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
        cedulaIdentidad: insc.cedulaIdentidad,
        instagram: insc.instagram || '-',
        fechaNacimiento: insc.fechaNacimiento ? insc.fechaNacimiento.toISOString() : null,
        edad: insc.edadAlInscribir || insc.edad || null,
        email: insc.email,
        telefono: insc.telefono,
        categoria: insc.categoria,
        estatusInscripcion: insc.estatusInscripcion,
        biografia: insc.biografia,
        createdAt: insc.createdAt.toISOString(),
        fotoPerfilUrl: fotoPerfilUrl,
        comprobanteUrl: comprobanteUrl,
        ocrData: insc.pago?.ocrResultadoRaw || null,
        referencia: insc.pago?.referencia || '-',
        bancoOrigen: insc.pago?.bancoOrigenCodigo || '-',
        montoBs: insc.pago?.montoCapturadoBs || '-',
        concepto: insc.pago?.concepto || '-',
        ocrReferenciaDetectada: insc.pago?.ocrReferenciaDetectada || null,
        ocrBancoEmisorCodigo: insc.pago?.ocrBancoEmisorCodigo || null,
        ocrMontoDetectadoBs: insc.pago?.ocrMontoDetectadoBs ? Number(insc.pago.ocrMontoDetectadoBs) : null,
        ocrConceptoExtraido: insc.pago?.ocrConceptoExtraido || null,
        ocrFechaExtraida: insc.pago?.ocrFechaExtraida ? insc.pago.ocrFechaExtraida.toISOString() : null,
        ocrConformidadGeneral: insc.pago?.ocrConformidadGeneral || false,
        estatusPago: insc.pago?.estatusPago || 'EN_REVISION',
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
