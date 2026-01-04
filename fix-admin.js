const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const email = 'centauroadss@gmail.com'; 
  const newPassword = 'admin123'; 
  
  console.log(`🔨 Arreglando acceso (Versión 2) para: ${email}...`);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const admin = await prisma.admin.upsert({
    where: { email: email },
    update: { password: hashedPassword },
    create: {
      email: email,
      password: hashedPassword,
      role: 'ADMIN',
      nombre: 'Admin Centauro'  // <--- ¡Esto faltaba!
    },
  });
  console.log('✅ ¡LISTO! Usuario creado correctamente.');
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
