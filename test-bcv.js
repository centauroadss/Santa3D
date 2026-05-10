const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('[Test Local] Consultando DolarAPI...');
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    const data = await response.json();
    
    const usdValue = data.promedio;
    console.log(`[Test Local] Tasa obtenida de la API: ${usdValue} Bs`);
    
    let fechaOficial = new Date();
    if (data.fechaActualizacion) {
      fechaOficial = new Date(data.fechaActualizacion);
    }
    fechaOficial.setUTCHours(0, 0, 0, 0);
    console.log(`[Test Local] Fecha Valor: ${fechaOficial.toISOString()}`);
    
    console.log('[Test Local] Intentando guardar en la base de datos local...');
    const record = await prisma.tasaBcvHistorico.upsert({
      where: { fecha: fechaOficial },
      update: { tasaUsdBs: usdValue, fuenteUrl: 'https://ve.dolarapi.com' },
      create: { fecha: fechaOficial, tasaUsdBs: usdValue, fuenteUrl: 'https://ve.dolarapi.com' }
    });
    
    console.log('[Test Local] ¡ÉXITO! Registro guardado correctamente en tu Base de Datos:');
    console.log(record);
  } catch (error) {
    console.error('[Test Local] Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
