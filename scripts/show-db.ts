import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.tasaBcvHistorico.findMany({
    orderBy: { fechaValor: 'desc' }
  });

  console.log('| ID | Fecha Ejecución | Fecha Valor | Tasa USD/Bs |');
  console.log('|---|---|---|---|');
  for (const record of records) {
    const fEjecucion = record.fecha.toISOString().split('T')[0];
    const fValor = record.fechaValor.toISOString().split('T')[0];
    const tasa = record.tasaUsdBs.toString();
    console.log(`| ${record.id} | ${fEjecucion} | **${fValor}** | ${tasa} |`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
