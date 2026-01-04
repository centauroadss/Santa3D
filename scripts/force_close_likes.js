const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- FORCING CLOSING LIKES (EMERGENCY SCRIPT) ---');

    // Get all validated videos
    const videos = await prisma.video.findMany({
        where: {
            status: 'VALIDATED'
        },
        include: {
            participant: true
        }
    });

    console.log(`Found ${videos.length} validated videos.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const video of videos) {
        const { id, instagramLikes, closingLikes } = video;
        const participantName = video.participant ? `${video.participant.nombre} ${video.participant.apellido}` : 'Unknown';

        // Logic: 
        // "verifque que el campo likes cierre esta lleno , si es asi esta bien"
        // "si esta vacio o con cualquier otro valor forzalo" (= if empty/0, copy likes)

        let shouldUpdate = false;

        // Consider 'vacio' as null, undefined, or 0.
        // We will overwrite if it is 0 or null.
        if (closingLikes === null || closingLikes === undefined || closingLikes === 0) {
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            // Only log if it's a meaningful change or purely filling a null
            console.log(`[UPDATE] ${participantName} (VidID: ${id}): closingLikes was ${closingLikes}, setting to ${instagramLikes}`);

            await prisma.video.update({
                where: { id: id },
                data: {
                    closingLikes: instagramLikes,
                    closingLikesAt: new Date(),
                }
            });
            updatedCount++;
        } else {
            // closingLikes > 0
            skippedCount++;
            // console.log(`[SKIP] ${participantName}: already has ${closingLikes}`);
        }
    }

    console.log(`\n--- SUMMARY ---`);
    console.log(`Total Validated Videos: ${videos.length}`);
    console.log(`Updated (Forced): ${updatedCount}`);
    console.log(`Skipped (Already Populated): ${skippedCount}`);
    console.log(`Done.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
