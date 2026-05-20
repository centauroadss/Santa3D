import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.configConcurso.findMany({
            where: {
                clave: {
                    in: [
                        'costo_una_categoria', 'costo_ambas_categorias', 'pago_banco', 
                        'pago_cedula', 'pago_telefono', 'emails_bcc_general',
                        'fecha_limite_video', 'fecha_limite_votacion', 'fecha_fin_concurso'
                    ]
                }
            }
        });

        // Convertir a un objeto
        const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);

        // Valores por defecto si no existen
        const finalConfig = {
            costo_una_categoria: configMap['costo_una_categoria'] || '5',
            costo_ambas_categorias: configMap['costo_ambas_categorias'] || '10',
            pago_banco: configMap['pago_banco'] || 'Banesco',
            pago_cedula: configMap['pago_cedula'] || 'J123456789',
            pago_telefono: configMap['pago_telefono'] || '04140000000',
            emails_bcc_general: configMap['emails_bcc_general'] || 'mercadeo@centauroads.com',
            fecha_limite_video: configMap['fecha_limite_video'] || '2026-06-05T23:59:59',
            fecha_limite_votacion: configMap['fecha_limite_votacion'] || '2026-06-15T23:59:59',
            fecha_fin_concurso: configMap['fecha_fin_concurso'] || '2026-06-20T23:59:59',
        };

        return NextResponse.json({ success: true, data: finalConfig }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { costo_una_categoria, costo_ambas_categorias, pago_banco, pago_cedula, pago_telefono, fecha_limite_video, fecha_limite_votacion, fecha_fin_concurso } = body;

        // Upsert costo_una_categoria
        if (costo_una_categoria !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'costo_una_categoria' },
                update: { valor: costo_una_categoria.toString() },
                create: { clave: 'costo_una_categoria', valor: costo_una_categoria.toString(), descripcion: 'Costo en USD por una categoría' }
            });
        }

        // Upsert costo_ambas_categorias
        if (costo_ambas_categorias !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'costo_ambas_categorias' },
                update: { valor: costo_ambas_categorias.toString() },
                create: { clave: 'costo_ambas_categorias', valor: costo_ambas_categorias.toString(), descripcion: 'Costo en USD por ambas categorías' }
            });
        }

        // Upsert pago_banco
        if (pago_banco !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'pago_banco' },
                update: { valor: pago_banco.toString() },
                create: { clave: 'pago_banco', valor: pago_banco.toString(), descripcion: 'Banco receptor de pago móvil' }
            });
        }

        // Upsert pago_cedula
        if (pago_cedula !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'pago_cedula' },
                update: { valor: pago_cedula.toString() },
                create: { clave: 'pago_cedula', valor: pago_cedula.toString(), descripcion: 'CI/RIF receptor de pago móvil' }
            });
        }

        // Upsert pago_telefono
        if (pago_telefono !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'pago_telefono' },
                update: { valor: pago_telefono.toString() },
                create: { clave: 'pago_telefono', valor: pago_telefono.toString(), descripcion: 'Teléfono receptor de pago móvil' }
            });
        }

        // Upsert emails_bcc_general
        if (body.emails_bcc_general !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'emails_bcc_general' },
                update: { valor: body.emails_bcc_general.toString() },
                create: { clave: 'emails_bcc_general', valor: body.emails_bcc_general.toString(), descripcion: 'Correos a los que enviar copia oculta (BCC) separados por coma' }
            });
        }

        // Upsert fecha_limite_video
        if (fecha_limite_video !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'fecha_limite_video' },
                update: { valor: fecha_limite_video.toString() },
                create: { clave: 'fecha_limite_video', valor: fecha_limite_video.toString(), descripcion: 'Fecha límite para entregar video' }
            });
        }

        // Upsert fecha_limite_votacion
        if (fecha_limite_votacion !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'fecha_limite_votacion' },
                update: { valor: fecha_limite_votacion.toString() },
                create: { clave: 'fecha_limite_votacion', valor: fecha_limite_votacion.toString(), descripcion: 'Fecha límite para votar' }
            });
        }

        // Upsert fecha_fin_concurso
        if (fecha_fin_concurso !== undefined) {
            await prisma.configConcurso.upsert({
                where: { clave: 'fecha_fin_concurso' },
                update: { valor: fecha_fin_concurso.toString() },
                create: { clave: 'fecha_fin_concurso', valor: fecha_fin_concurso.toString(), descripcion: 'Fecha fin del concurso (Cronómetro)' }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
