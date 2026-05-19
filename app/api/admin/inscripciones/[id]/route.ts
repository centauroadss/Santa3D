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
import { authenticateRequest } from '@/lib/auth';

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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'id inválido' }, { status: 400 });

    const body = await request.json();

    const inscripcion = await prisma.inscripcionCopa2026.update({
      where: { id },
      data: {
        nombre: body.nombre,
        apellido: body.apellido,
        cedulaIdentidad: body.cedulaIdentidad,
        telefono: body.telefono,
        email: body.email,
        instagram: body.instagram,
        categoria: body.categoria,
        estatusInscripcion: body.estatusInscripcion,
      },
    });

    if (body.pago) {
        const updateData: any = {
            bancoOrigenCodigo: body.pago.bancoOrigenCodigo,
            referencia: body.pago.referencia,
            montoCapturadoBs: body.pago.montoCapturadoBs ? parseFloat(body.pago.montoCapturadoBs) : undefined,
            concepto: body.pago.concepto,
            estatusPago: body.pago.estatusPago,
        };
        
        // Add OCR fields if they are provided
        if (body.pago.ocrBancoEmisorCodigo !== undefined) updateData.ocrBancoEmisorCodigo = body.pago.ocrBancoEmisorCodigo;
        if (body.pago.ocrReferenciaDetectada !== undefined) updateData.ocrReferenciaDetectada = body.pago.ocrReferenciaDetectada;
        if (body.pago.ocrMontoDetectadoBs !== undefined) updateData.ocrMontoDetectadoBs = body.pago.ocrMontoDetectadoBs ? parseFloat(body.pago.ocrMontoDetectadoBs) : null;
        if (body.pago.ocrConceptoExtraido !== undefined) updateData.ocrConceptoExtraido = body.pago.ocrConceptoExtraido;
        if (body.pago.ocrFechaExtraida !== undefined) updateData.ocrFechaExtraida = body.pago.ocrFechaExtraida ? new Date(body.pago.ocrFechaExtraida) : null;

        await prisma.pagoMovil.update({
            where: { inscripcionId: id },
            data: updateData
        });
    }

    return NextResponse.json({ success: true, data: inscripcion });
  } catch (e: any) {
    console.error('PUT /api/admin/inscripciones/[id] error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'id inválido' }, { status: 400 });

    await prisma.inscripcionCopa2026.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('DELETE /api/admin/inscripciones/[id] error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
