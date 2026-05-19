const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const insc = await prisma.inscripcionCopa2026.findFirst();
  console.log(insc ? 'Found one!' : 'No records at all');
}
main().finally(() => prisma.$disconnect());
