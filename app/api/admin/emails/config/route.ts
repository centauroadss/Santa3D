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

        const configs = await prisma.configConcurso.findUnique({
            where: { clave: 'enlaces_adjuntos_json' }
        });

        const dynamicLinks = configs?.valor ? JSON.parse(configs.valor) : [];

        return NextResponse.json({ success: true, data: { dynamicLinks } });
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
        const dynamicLinks = body.dynamicLinks || [];

        await prisma.configConcurso.upsert({
            where: { clave: 'enlaces_adjuntos_json' },
            update: { valor: JSON.stringify(dynamicLinks) },
            create: { clave: 'enlaces_adjuntos_json', valor: JSON.stringify(dynamicLinks), descripcion: `Enlaces Dinámicos` }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
