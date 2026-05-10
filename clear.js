const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    await prisma.inscripcionCopa2026.deleteMany({});
    console.log('Registros eliminados');
    await prisma.configConcurso.upsert({
        where: { clave: 'emails_bcc_general' },
        update: { valor: 'mercadeo@centauroads.com' },
        create: { clave: 'emails_bcc_general', valor: 'mercadeo@centauroads.com' }
    });
    console.log('BCC configurado');
}
main().catch(console.error).finally(() => prisma.$disconnect());
