const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.tasaBcvHistorico.findMany({
    orderBy: { id: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(records, null, 2));
}

main().finally(() => prisma.$disconnect());
