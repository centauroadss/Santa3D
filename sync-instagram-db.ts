import { PrismaClient } from '@prisma/client';
import { InstagramService } from './lib/instagram';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
async function main() {
  console.log('🔄 INICIANDO SINCRONIZACION INSTAGRAM -> DB PÚBLICA...');
  // 1. Obtener datos de Instagram
  let igMedia = [];
  try {
      igMedia = await InstagramService.getTaggedMedia();
      console.log(`📸 Se encontraron ${igMedia.length} posts etiquetados en Instagram.`);
  } catch (e: any) {
      console.error('❌ Error conectando a Instagram:', e.message);
      return;
  }
  // 2. Obtener Participantes
  const participants = await prisma.participant.findMany({
      where: { instagram: { not: '' } },
      include: { video: true }
  });
  // 3. Cruzar informacion y actualizar
  let updatedCount = 0;
  for (const media of igMedia) {
      const igUser = (media.username || '').toLowerCase().replace('@', '').trim();
      const owner = participants.find(p => p.instagram.toLowerCase().replace('@', '').trim() === igUser);
      if (owner && owner.video) {
          await prisma.video.update({
              where: { id: owner.video.id },
              data: {
                  instagramUrl: media.permalink || media.media_url, 
                  instagramLikes: media.like_count || 0,
                  lastInstagramSync: new Date()
              }
          });
          
          console.log(`✅ SINCRONIZADO: ${owner.alias} (${owner.instagram}) - Likes: ${media.like_count}`);
          updatedCount++;
      }
  }
  console.log(`\n🏁 PROCESO TERMINADO. ${updatedCount} videos actualizados.`);
}
main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
