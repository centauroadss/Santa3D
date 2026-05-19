const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.videoCopa2026.findMany({
  include: { inscripcion: true }
}).then(res => console.log(JSON.stringify(res, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2)))
.catch(console.error)
.finally(() => p.$disconnect());
