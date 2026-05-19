const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

async function main() {
  const token = uuidv4();
  const insc = await prisma.inscripcionCopa2026.create({
    data: {
        nombre: 'Test',
        apellido: 'Test',
        cedulaIdentidad: '12345678',
        telefono: '04141234567',
        email: 'test@example.com',
        categoria: 'RENDER',
        tokenVideo: token,
        tokenExpiry: new Date(Date.now() + 86400000), // tomorrow
        estatusToken: 'PENDIENTE',
        estatusInscripcion: 'APROBADO',
        fechaNacimiento: new Date('1990-01-01'),
        biografia: 'Test',
        edadAlInscribir: 30,
    }
  });
  console.log(`Token created: ${token}`);
}
main().finally(() => prisma.$disconnect());
