const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        console.log("\n🔍 CONSULTANDO RANKING (Top 5 por Likes)...");
        
        // Misma lógica que /api/public/ranking
        const topVideos = await prisma.video.findMany({
            where: {
                status: 'VALIDATED',
                lastInstagramSync: { not: null } 
            },
            orderBy: {
                instagramLikes: 'desc'
            },
            take: 5,
            include: {
                participant: {
                    select: {
                        alias: true,
                        instagram: true,
                    }
                }
            }
        });
        if (topVideos.length === 0) {
            console.log("❌ No se encontraron videos validados con sincronización activa (lastInstagramSync !== null).");
            return;
        }
        console.log("\n========================================");
        console.log("       TOP 5 CONCURSANTES (LIVE)       ");
        console.log("========================================");
        
        topVideos.forEach((video, index) => {
            const handle = video.participant.instagram.startsWith('@') 
                ? video.participant.instagram 
                : '@' + video.participant.instagram;
                
            console.log(`#${index + 1} | ${handle.padEnd(20)} | Likes: ${video.instagramLikes} | (${video.participant.alias})`);
        });
        console.log("========================================\n");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
