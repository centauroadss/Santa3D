import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const inscripcion = await prisma.inscripcionCopa2026.findUnique({
    where: { id: 17 },
    include: { pago: true }
  });
  console.log("Foto Path:", inscripcion?.fotoPerfilPath);
  console.log("Comprobante Path:", inscripcion?.pago?.comprobantePath);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
