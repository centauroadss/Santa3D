const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('--- LISTA DE ADMINISTRADORES ---');
  const admins = await prisma.admin.findMany();
  admins.forEach(a => {
      console.log(`ID: ${a.id} | Email: ${a.email}`);
  });
  console.log('--------------------------------');
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
