import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Buscando videos pendientes de validación...');

    const videos = await prisma.video.findMany({
        where: {
            status: 'PENDING_VALIDATION'
        },
        take: 10,
        orderBy: {
            uploadedAt: 'desc'
        },
        select: {
            id: true,
            fileName: true,
            status: true,
            uploadedAt: true,
            participant: {
                select: {
                    email: true,
                    nombre: true,
                    instagram: true
                }
            }
        }
    });

    if (videos.length === 0) {
        console.log('✅ No hay videos pendientes de validación.');
    } else {
        console.log(`⚠️ Encontrados ${videos.length} videos pendientes:`);
        videos.forEach(v => {
            console.log('------------------------------------------------');
            console.log(`ID: ${v.id}`);
            console.log(`Usuario: ${v.participant.nombre} (${v.participant.email})`);
            console.log(`Instagram Entregado: '${v.participant.instagram}'`);
            console.log(`Fecha Subida: ${v.uploadedAt}`);
            console.log('------------------------------------------------');
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
