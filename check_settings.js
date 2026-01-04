
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking ContestSettings for email templates...');
    try {
        const settings = await prisma.contestSetting.findMany(); // Assuming the model is contestSetting based on schema
        console.log('Settings found:', settings);

        // Also check generic text fields in other tables?
        // Not likely.

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
