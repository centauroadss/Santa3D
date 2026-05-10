const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inscripciones = await prisma.inscripcionCopa2026.findMany({
    include: { pago: true }
  });
  console.log("Total inscripciones:", inscripciones.length);
  for (const i of inscripciones) {
    console.log(`ID: ${i.id}, fotoPerfilPath: ${i.fotoPerfilPath}, comprobantePath: ${i.pago ? i.pago.comprobantePath : 'none'}`);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
