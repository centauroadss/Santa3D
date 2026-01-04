
import { prisma } from './lib/prisma';
import { getPublicVideoUrl } from './lib/storage';

async function main() {
    console.log('--- DEBUGGING RANKING VIDEO URLS ---');

    // 1. Fetch Top 5 exactly like the API
    // Need to mimic the ranking logic: Pure Evaluation Score

    const allVideos = await prisma.video.findMany({
        where: { status: 'VALIDATED' },
        include: {
            participant: true,
            evaluations: true
        }
    });

    const candidates = allVideos.map(video => {
        let juryAvg = 0;
        if (video.evaluations.length > 0) {
            const sum = video.evaluations.reduce((acc, ev) => acc + ev.puntajeTotal, 0);
            juryAvg = sum / video.evaluations.length;
        }
        return { video, finalScore: juryAvg };
    });

    candidates.sort((a, b) => b.finalScore - a.finalScore);
    const top5 = candidates.slice(0, 5);

    console.log(`Found ${top5.length} videos in Top 5.`);

    for (const [index, item] of top5.entries()) {
        const v = item.video;
        console.log(`\n--- POSITION #${index + 1} ---`);
        console.log(`ID: ${v.id}`);
        console.log(`Alias: ${v.participant.alias}`);
        console.log(`Instagram: ${v.participant.instagram}`);
        console.log(`Score: ${item.finalScore}`);
        console.log(`DB raw URL: ${v.url}`);
        console.log(`Storage Key: ${v.storageKey}`);

        // Logic from route.ts
        let streamUrl = v.url;
        if ((!streamUrl || streamUrl.trim() === '') && v.storageKey) {
            streamUrl = await getPublicVideoUrl(v.storageKey);
            console.log(`[Logic] Empty URL, resolved from Key: ${streamUrl}`);
        } else if (streamUrl && streamUrl.includes('digitaloceanspaces') && v.storageKey) {
            streamUrl = await getPublicVideoUrl(v.storageKey);
            console.log(`[Logic] DO Space URL, forced refresh from Key: ${streamUrl}`);
        }

        if (!streamUrl || streamUrl === '') {
            streamUrl = v.url || '';
            console.log(`[Logic] Fallback to raw: ${streamUrl}`);
        }

        console.log(`FINAL STREAM URL: ${streamUrl}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
