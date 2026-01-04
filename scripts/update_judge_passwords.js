
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Iniciando actualización masiva de contraseñas de jueces...');

    try {
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`🔐 Contraseña hasheada generada para: "${newPassword}"`);

        const result = await prisma.judge.updateMany({
            data: {
                password: hashedPassword,
                isDefaultPassword: true // Set flag so they are prompted to change it (optional but good practice)
            }
        });

        console.log(`✅ ÉXITO: Se actualizaron ${result.count} jueces con la nueva contraseña.`);

    } catch (error) {
        console.error('❌ Error actualizando contraseñas:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
