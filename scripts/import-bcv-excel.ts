import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();
const TZ = 'America/Caracas';

function excelDateToJSDate(serial: number) {
  // Excel epoch is Jan 1 1900. Note the leap year bug for 1900.
  // 25569 is the number of days from 1900-01-01 to 1970-01-01.
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);

  // Considertimezone offset to align with Caracas (UTC-4) correctly
  // Instead of trying to fix UTC, just create a date and parse it as UTC, then startOfDay.
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;

  date_info.setUTCHours(hours, minutes, seconds);

  // We want the start of the day in UTC for these dates
  return new Date(Date.UTC(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate()));
}

async function main() {
  const filePath = 'C:\\Users\\joaou\\OneDrive\\Documentos\\Tabla historica TC OFICIAL BCV.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { raw: true });
  
  let importedCount = 0;
  let skippedCount = 0;

  console.log(`Leyendo ${data.length} filas del Excel...`);

  for (const row of data) {
    const rawFechaEjecucion = row['Fecha de Ejecucion'];
    const rawFechaValor = row['Fecha Valor'];
    const rawTasa = row['Tasa Oficial BCV'];

    if (!rawFechaEjecucion || !rawFechaValor || !rawTasa) {
      console.log('Skipping invalid row', row);
      continue;
    }

    const fecha = excelDateToJSDate(rawFechaEjecucion);
    const fechaValor = excelDateToJSDate(rawFechaValor);
    const tasa = parseFloat(rawTasa);

    try {
      await prisma.tasaBcvHistorico.upsert({
        where: { fecha }, // Unique constraint is on 'fecha'
        update: {
          tasaUsdBs: tasa,
          fechaValor,
        },
        create: {
          fecha,
          fechaValor,
          tasaUsdBs: tasa,
          fechaEjecucion: new Date(),
          fuenteUrl: 'EXCEL_IMPORT',
        },
      });
      importedCount++;
    } catch (e: any) {
      console.error(`Error procesando fila (Fecha: ${fecha.toISOString()}):`, e.message);
      skippedCount++;
    }
  }

  console.log(`Importación finalizada. Importados/Actualizados: ${importedCount}. Omitidos/Con Error: ${skippedCount}.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
