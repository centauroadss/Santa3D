const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log("Tasas:", await prisma.tasaBcvHistorico.findMany());
}
main().catch(console.error).finally(() => prisma.$disconnect());
