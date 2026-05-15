import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.plantillaEmail.findUnique({ where: { tipo: 'BIENVENIDA' } });
  console.log("Plantilla de Bienvenida:");
  console.log(JSON.stringify(template, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
