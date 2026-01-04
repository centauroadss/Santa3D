const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const email = process.argv[2];
if (!email) {
  console.log('❌ Error: Debes proporcionar un email.');
  console.log('Uso: node scripts/delete_participant.js user@example.com');
  process.exit(1);
}
async function main() {
  console.log(`🗑️  Eliminando participante: ${email}...`);
  try {
    const deleted = await prisma.participant.delete({
      where: { email: email },
    });
    console.log(`✅ Participante eliminado (ID: ${deleted.id})`);
    console.log('   Video asociado eliminado automáticamente en cascada.');
  } catch (e) {
    if (e.code === 'P2025') {
        console.log('⚠️  No se encontró ningún participante con ese email.');
    } else {
        console.error('❌ Error:', e.message);
    }
  }
}
main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
