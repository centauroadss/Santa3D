import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '@/lib/storage';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
        }

        const inscripcion = await prisma.inscripcionCopa2026.findUnique({
            where: { tokenVideo: token },
            include: {
                videos: true,
                pago: true
            }
        });

        if (!inscripcion) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        if (inscripcion.tokenExpiry && new Date() > inscripcion.tokenExpiry) {
            return NextResponse.json({ error: 'El plazo de carga de videos ha vencido.' }, { status: 410 });
        }

        // Obtener configuraciones del concurso y estadísticas
        const configs = await prisma.configConcurso.findMany({
            where: {
                clave: { in: ['fecha_cierre_videos', 'participantes_requeridos', 'costo_una_categoria'] }
            }
        });
        const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);
        
        const totalInscritos = await prisma.inscripcionCopa2026.count();
        const totalConVideos = await prisma.inscripcionCopa2026.count({
            where: {
                videos: { some: {} }
            }
        });

        const stats = {
            fechaCierre: configMap['fecha_cierre_videos'] || '2026-06-05T23:59:59Z',
            participantesRequeridos: parseInt(configMap['participantes_requeridos'] || '50'),
            costoInscripcion: parseFloat(configMap['costo_una_categoria'] || '5'),
            totalInscritos,
            totalConVideos
        };

        let bancoNombre = inscripcion.pago?.bancoOrigenCodigo || 'N/A';
        if (inscripcion.pago?.bancoOrigenCodigo) {
            try {
                const banco = await prisma.banco.findUnique({ where: { codigo: inscripcion.pago.bancoOrigenCodigo } });
                if (banco) bancoNombre = banco.nombre;
            } catch (e) {
                // Ignore
            }
        }

        const fotoPerfilUrl = await StorageService.getUrl(inscripcion.fotoPerfilPath || '');

        const participanteData = {
            nombre: inscripcion.nombre,
            apellido: inscripcion.apellido,
            categoria: inscripcion.categoria,
            cedulaIdentidad: inscripcion.cedulaIdentidad,
            fotoPerfilPath: fotoPerfilUrl,
            estatusPago: inscripcion.pago?.estatusPago,
            referenciaPago: inscripcion.pago?.referencia,
            comprobantePath: inscripcion.pago?.comprobantePath,
            createdAt: inscripcion.createdAt,
            montoBs: inscripcion.pago?.montoCapturadoBs || 0,
            fechaPago: inscripcion.pago?.fechaPagoExtractada || inscripcion.pago?.createdAt,
            bancoPago: bancoNombre
        };

        if (inscripcion.estatusToken === 'USADO' || inscripcion.estatusInscripcion === 'COMPLETADO') {
            return NextResponse.json({
                success: true,
                isLoaded: true,
                participante: participanteData,
                videos: inscripcion.videos,
                stats
            }, { status: 200 });
        }

        return NextResponse.json({
            success: true,
            isLoaded: false,
            participante: participanteData,
            stats
        }, { status: 200 });

    } catch (error) {
        console.error('Error verifying token:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
