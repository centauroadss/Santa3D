/**
 * GET /api/admin/inscripciones
 *
 * Devuelve el listado paginado de inscripciones para el panel del administrador.
 * Filtros opcionales:
 *   - q          (busca en nombre/apellido/cédula/email)
 *   - categoria  (RENDER / IA / AMBAS)
 *   - estatus    (APROBADO / PENDIENTE / RECHAZADO / COMPLETADO)
 *   - desde, hasta (fechas ISO)
 *
 * NOTA: la página de detalle (con foto, comprobante, videos) usa
 *       GET /api/admin/inscripciones/[id]
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const categoria = searchParams.get('categoria') ?? '';
    const estatus = searchParams.get('estatus') ?? '';
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10))
    );

    const where: any = {};
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { apellido: { contains: q, mode: 'insensitive' } },
        { cedulaIdentidad: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (categoria) where.categoria = categoria;
    if (estatus) where.estatusInscripcion = estatus;
    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt.gte = new Date(desde);
      if (hasta) where.createdAt.lte = new Date(hasta);
    }

    const [total, items] = await Promise.all([
      prisma.inscripcionCopa2026.count({ where }),
      prisma.inscripcionCopa2026.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          cedulaIdentidad: true,
          email: true,
          telefono: true,
          categoria: true,
          estatusInscripcion: true,
          createdAt: true,
          edadAlInscribir: true,
          videos: { select: { id: true } }, // sólo count
        },
      }),
    ]);

    return NextResponse.json({
      items: items.map((i) => ({
        ...i,
        videosCount: i.videos.length,
        videos: undefined,
      })),
      total,
      page,
      pageSize,
    });
  } catch (e) {
    console.error('admin/inscripciones GET error:', e);
    return NextResponse.json({ error: 'Error listando inscripciones' }, { status: 500 });
  }
}
