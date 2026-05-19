const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.inscripcionCopa2026.findMany().then(r => console.log(JSON.stringify(r, null, 2))).catch(console.error).finally(() => p.$disconnect());
