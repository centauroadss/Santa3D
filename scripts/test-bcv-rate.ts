import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dateStr = '2026-05-06';
  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
  
  const bcv = await prisma.tasaBcvHistorico.findFirst({
    where: {
      fechaValor: targetDate
    }
  });

  if (bcv) {
    console.log(`Tasa BCV para ${dateStr}: Bs. ${bcv.tasaUsdBs}`);
    const rate = parseFloat(bcv.tasaUsdBs.toString());
    console.log(`Monto para $5: Bs. ${(rate * 5).toFixed(2)}`);
    console.log(`Monto para $10: Bs. ${(rate * 10).toFixed(2)}`);
  } else {
    console.log(`No se encontró tasa para la fecha ${dateStr}`);
    
    // Let's print the last 5 rates just in case
    const recent = await prisma.tasaBcvHistorico.findMany({
      orderBy: { fechaValor: 'desc' },
      take: 5
    });
    console.log("Últimas tasas guardadas:");
    for (const r of recent) {
      console.log(`- ${r.fechaValor.toISOString()}: Bs. ${r.tasaUsdBs}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
