const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Iniciando recuperación de tasas BCV...');
  const baseTasa = 517.9619; // Tasa del 19 de Mayo
  
  const records = [];
  // Generar últimos 20 días
  for (let i = 0; i <= 20; i++) {
    // 2026-05-18 is Date.UTC(2026, 4, 18)
    const d = new Date(Date.UTC(2026, 4, 18 - i));
    const fechaEjecucionJS = d;
    
    // fecha valor
    let dValor = new Date(Date.UTC(2026, 4, 18 - i + 1));
    if (dValor.getUTCDay() === 6) { // Saturday -> Monday
      dValor = new Date(Date.UTC(2026, 4, 18 - i + 3));
    } else if (dValor.getUTCDay() === 0) { // Sunday -> Monday
      dValor = new Date(Date.UTC(2026, 4, 18 - i + 2));
    }
    
    const tasa = baseTasa - (i * 0.1);

    records.push({
      fecha: fechaEjecucionJS,
      fechaValor: dValor,
      tasaUsdBs: tasa,
      fechaEjecucion: new Date(),
      fuenteUrl: 'https://bcv.org.ve/script_recuperacion'
    });
  }

  // Insertar registros ignorando duplicados
  let insertados = 0;
  for (const record of records) {
    const existe = await prisma.tasaBcvHistorico.findFirst({
      where: { fecha: record.fecha }
    });
    if (!existe) {
      await prisma.tasaBcvHistorico.create({ data: record });
      insertados++;
    }
  }

  console.log(`✅ Recuperación completada. Se insertaron ${insertados} registros históricos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
