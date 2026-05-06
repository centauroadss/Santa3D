import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EMAIL_CONFIG_KEYS = [
    'url_adjunto_registro_video',
    'url_adjunto_certificado',
    'url_adjunto_bienvenida_juez',
    'url_adjunto_agradecimiento_juez'
];

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request);
        if (!auth || auth.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.configConcurso.findMany({
            where: { clave: { in: EMAIL_CONFIG_KEYS } }
        });

        const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);

        const finalConfig = {
            url_adjunto_registro_video: configMap['url_adjunto_registro_video'] || '',
            url_adjunto_certificado: configMap['url_adjunto_certificado'] || '',
            url_adjunto_bienvenida_juez: configMap['url_adjunto_bienvenida_juez'] || '',
            url_adjunto_agradecimiento_juez: configMap['url_adjunto_agradecimiento_juez'] || ''
        };

        return NextResponse.json({ success: true, data: finalConfig });
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

        for (const key of EMAIL_CONFIG_KEYS) {
            if (body[key] !== undefined) {
                await prisma.configConcurso.upsert({
                    where: { clave: key },
                    update: { valor: body[key] },
                    create: { clave: key, valor: body[key], descripcion: `URL Adjunto para: ${key}` }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
