const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('--- DIAGNOSTICO DE PRODUCCION ---');
  // 1. Ver videos seleccionados para Jueces
  const judgeVideos = await prisma.video.findMany({
    where: { isJudgeSelected: true },
    select: { id: true, url: true, storageKey: true, fileName: true, status: true }
  });
  
  console.log(`Videos Seleccionados para Jueces: ${judgeVideos.length}`);
  if (judgeVideos.length > 0) {
      console.log(JSON.stringify(judgeVideos.slice(0, 5), null, 2));
  } else {
      console.log('ADVERTENCIA: No hay videos con isJudgeSelected=true');
  }
  // 2. Ver videos VALIDADOS (que sí se ven en el Admin) para comparar
  const adminVideos = await prisma.video.findMany({
      where: { status: 'VALIDATED' },
      take: 3,
      select: { id: true, url: true, storageKey: true }
  });
  console.log('\n--- DATOS DE REFERENCIA (ADMIN) ---');
  console.log(JSON.stringify(adminVideos, null, 2));
}
main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
