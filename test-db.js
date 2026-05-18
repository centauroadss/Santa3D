process.env.DATABASE_URL = "mysql://santa_db_user:SantaSecure2025!@167.172.217.151:3306/santa3d";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pagos = await prisma.pagoMovil.findMany({
    orderBy: { id: 'desc' },
    take: 1,
    include: { inscripcion: true }
  });
  console.log(JSON.stringify(pagos[0], null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
