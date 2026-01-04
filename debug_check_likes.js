
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Input provided by user
    const inputAliases = ['@abraham.musicart', '@jesuelmontilla'];

    console.log('--- Checking Participants (Deep Scan) ---');
    for (const input of inputAliases) {
        // Remove @ for broader search logic
        const term = input.replace('@', '');
        console.log(`\nSEARCH KEY: "${term}"`);

        // Search in alias, instagram, name, apellido
        const participants = await prisma.participant.findMany({
            where: {
                OR: [
                    { alias: { contains: term } },
                    { instagram: { contains: term } },
                    { nombre: { contains: term } },
                    { apellido: { contains: term } }
                ]
            },
            include: { video: true }
        });

        if (participants.length === 0) {
            console.log(`[NOT FOUND] No matches for "${term}"`);
            continue;
        }

        console.log(`FOUND ${participants.length} MATCHES:`);
        participants.forEach(p => {
            console.log(`\n[USER] ${p.nombre} ${p.apellido} (ID: ${p.id})`);
            console.log(`  Alias: ${p.alias}`);
            console.log(`  IG: ${p.instagram}`);
            if (p.video) {
                console.log(`  [VIDEO] ID: ${p.video.id}`);
                console.log(`  Status: ${p.video.status}`);
                console.log(`  Instagram Likes: ${p.video.instagramLikes}`);
                console.log(`  Closing Likes: ${p.video.closingLikes}`);
                console.log(`  Closing Date: ${p.video.closingLikesAt}`);
            } else {
                console.log(`  [NO VIDEO LINKED]`);
            }
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
