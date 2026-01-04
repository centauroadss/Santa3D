const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const email = 'aliriopal@hotmail.com';
  
  console.log(`Searching for participant with email: ${email}`);
  const participant = await prisma.participant.findUnique({
    where: { email },
    include: { video: true }
  });
  if (!participant) {
    console.error('❌ Participant not found!');
    return;
  }
  if (!participant.video) {
    console.error('❌ Participant has no video record.');
    return;
  }
  console.log(`Found participant: ${participant.nombre} ${participant.apellido}`);
  console.log(`Current Video Status: ${participant.video.status}`);
  const updated = await prisma.video.update({
    where: { id: participant.video.id },
    data: {
      status: 'PENDING_VALIDATION',
      validatedAt: null, // Clear validation date
      // rejectionReason: null // Optional: clear rejection reason if any
    }
  });
  console.log('✅ Video updated successfully.');
  console.log(`New Status: ${updated.status}`);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
