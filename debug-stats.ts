import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('🔍 DIAGNOSTICO DE RANKING PRODUCCION 🔍');
  // 1. Buscar TODOS los videos validados
  const videos = await prisma.video.findMany({
    where: { status: 'VALIDATED' },
    select: { 
        id: true, 
        instagramUrl: true, 
        status: true,
        instagramLikes: true,
        participant: { select: { alias: true, instagram: true } }
    }
  });
  console.log(`\n📊 Videos con estado VALIDATED: ${videos.length}`);
  console.table(videos);
  // 2. Simular la query del Ranking exacto
  const ranking = await prisma.video.findMany({
      where: {
          status: 'VALIDATED',
          instagramUrl: { not: null },
      },
      orderBy: { instagramLikes: 'desc' },
      take: 5
  });
  console.log(`\n🏆 Videos que aparecen en el Ranking Publico: ${ranking.length}`);
  console.table(ranking);
  if (videos.length > 0 && ranking.length === 0) {
      console.log('\n❌ CAUSA: Tienes videos validados, pero NO tienen link de Instagram.');
      console.log('👉 SOLUCION: Ve a Admin > Instagram, desmarca y marca de nuevo el video y dale APROBAR de nuevo.');
  }
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
