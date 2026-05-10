const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Borrando videos...');
    await prisma.videoCopa2026.deleteMany({});
    console.log('Borrando pagos móviles...');
    await prisma.pagoMovil.deleteMany({});
    console.log('Borrando inscripciones...');
    await prisma.inscripcionCopa2026.deleteMany({});
    console.log('Limpieza completada con éxito.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
