const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- CHECKING FOR DUPLICATE PARTICIPANTS ---');

    const targets = ['jesuelmontilla', 'abraham.musicart'];

    for (const target of targets) {
        console.log(`\nSearching for: ${target}`);
        const users = await prisma.participant.findMany({
            where: {
                instagram: {
                    contains: target
                }
            },
            include: {
                video: true
            }
        });

        if (users.length === 0) {
            console.log('No users found.');
        } else {
            console.log(`Found ${users.length} records:`);
            users.forEach(u => {
                console.log(`- ID: ${u.id} | Name: ${u.nombre} ${u.apellido} | IG: ${u.instagram}`);
                console.log(`  Has Video? ${u.video ? 'YES' : 'NO'}`);
                if (u.video) {
                    console.log(`  > Video ID: ${u.video.id} | Status: ${u.video.status} | ClosingLikes: ${u.video.closingLikes}`);
                }
            });
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
