const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const inscripciones = await prisma.inscripcionCopa2026.findMany({
    select: { id: true, nombre: true, fotoPerfilPath: true, pago: { select: { comprobantePath: true } } },
    take: 5,
    orderBy: { id: 'desc' }
  });
  console.log(JSON.stringify(inscripciones, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
