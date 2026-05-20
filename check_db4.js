const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.tasaBcvHistorico.findMany({ orderBy: { fecha: 'desc' }, take: 10 });
  console.log(rows);
}
main().catch(console.error).finally(() => prisma.$disconnect());
