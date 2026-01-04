#!/bin/bash
echo "🚨 Emergency Fix: Forcing Closing Likes..."

# 1. Create the script on the server
cat << 'EOF' > scripts/force_close_likes.js
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

        let shouldUpdate = false;

        // Force if null, undefined, or 0
        if (closingLikes === null || closingLikes === undefined || closingLikes === 0) {
            shouldUpdate = true;
        }

        if (shouldUpdate) {
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
            skippedCount++;
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
EOF

# 2. Run the script
echo "Running force_close_likes.js..."
node scripts/force_close_likes.js

echo "✅ Done."
