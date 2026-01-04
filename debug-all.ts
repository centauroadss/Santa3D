import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('--- VER TODOS LOS VIDEOS ---');
  
  const allVideos = await prisma.video.findMany({
    select: {
      id: true,
      fileName: true,
      status: true,          // <--- IMPORTANTE VER ESTO
      instagramUrl: true,    // <--- Y ESTO
      participant: { select: { instagram: true, alias: true } }
    }
  });
  console.table(allVideos);
  console.log(`Total encontrados: ${allVideos.length}`);
}
main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
