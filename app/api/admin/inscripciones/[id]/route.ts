/**
 * GET /api/admin/inscripciones/[id]
 *
 * Detalle completo de UNA inscripción. Incluye todos los datos que el panel
 * admin debe mostrar:
 *   - Fecha y hora de inscripción (`createdAt`)
 *   - URL de la fotografía del participante
 *   - Datos personales completos
 *   - URL del comprobante de pago
 *   - Datos del pago (banco, referencia, monto, concepto, conceptoValidado)
 *   - Categoría(s)
 *   - Videos cargados (URL para reproducción)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    const inscripcion = await prisma.inscripcionCopa2026.findUnique({
      where: { id },
      include: {
        pago: true,
        videos: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!inscripcion) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      id: inscripcion.id,
      createdAt: inscripcion.createdAt,
      participante: {
        nombre: inscripcion.nombre,
        apellido: inscripcion.apellido,
        cedulaIdentidad: inscripcion.cedulaIdentidad,
        email: inscripcion.email,
        telefono: inscripcion.telefono,
        instagram: inscripcion.instagram,
        fechaNacimiento: inscripcion.fechaNacimiento,
        edadAlInscribir: inscripcion.edadAlInscribir,
        biografia: inscripcion.biografia,
        fotoPerfilUrl: inscripcion.fotoPerfilUrl,
        categoria: inscripcion.categoria,
        confirmaMayoriaEdad: inscripcion.confirmaMayoriaEdad,
        aceptaTerminos: inscripcion.aceptaTerminos,
        cesionDerechos: inscripcion.cesionDerechos,
      },
      pago: inscripcion.pago
        ? {
            banco: inscripcion.pago.bancoOrigenCodigo,
            cedulaPago: inscripcion.pago.cedulaPago,
            telefonoPago: inscripcion.pago.telefonoPago,
            referencia: inscripcion.pago.referencia,
            concepto: inscripcion.pago.concepto,
            conceptoValidado: inscripcion.pago.conceptoValidado,
            montoBs: inscripcion.pago.montoCapturadoBs?.toString() ?? null,
            comprobanteUrl: inscripcion.pago.comprobanteUrl,
            ocrJson: inscripcion.pago.ocrJson,
          }
        : null,
      videos: inscripcion.videos.map((v) => ({
        id: v.id,
        rutaS3: v.rutaS3,
        nombreArchivo: v.nombreArchivo,
        duracionSeg: v.duracionSeg,
        resolucion: v.resolucion,
        fps: v.fps,
        formato: v.formato,
        estatus: v.estatus,
        createdAt: v.createdAt,
      })),
      estado: {
        estatusInscripcion: inscripcion.estatusInscripcion,
        estatusToken: inscripcion.estatusToken,
        tokenVideo: inscripcion.tokenVideo,
      },
    });
  } catch (e) {
    console.error('admin/inscripciones/[id] GET error:', e);
    return NextResponse.json({ error: 'Error obteniendo detalle' }, { status: 500 });
  }
}
