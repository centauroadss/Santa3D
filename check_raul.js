const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.inscripcionCopa2026.findMany({
  where: { nombre: { contains: 'Raul' } },
  include: { videos: true }
}).then(res => console.log(JSON.stringify(res, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2)))
.catch(console.error)
.finally(() => p.$disconnect());
