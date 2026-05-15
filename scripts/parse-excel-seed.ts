import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { validateAll, BcvRow } from '../lib/copa2026/bcv-invariants';

const FILE_PATH = 'C:\\Users\\joaou\\OneDrive\\Documentos\\Tabla historicxa TC OFICIAL BCV.xlsx';
const SEED_DEST = path.join(process.cwd(), 'prisma', 'seeds', 'bcv-historico.seed.json');

function parseDateStr(m_d_yy: string) {
  // input: "5/14/26" -> "2026-05-14"
  const [m, d, y] = m_d_yy.split('/');
  const year = '20' + y;
  const month = m.padStart(2, '0');
  const day = d.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function generateSeed() {
  console.log("Leyendo archivo:", FILE_PATH);
  const workbook = xlsx.readFile(FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null }) as any[];

  // Sort chronological
  const reversed = [...rawData].reverse();

  const seedData = reversed.map((row) => {
    return {
      fecha: parseDateStr(row['Fecha de Ejecucion']),
      fechaValor: parseDateStr(row['Fecha Valor']),
      tasaUsdBs: parseFloat(row['Tasa Oficial BCV'])
    };
  });

  // Convert to mock BcvRow for invariant testing
  const mockRows: BcvRow[] = seedData.map((s, idx) => ({
    id: idx + 1,
    fecha: new Date(s.fecha + "T00:00:00.000-04:00"),
    fechaValor: new Date(s.fechaValor + "T00:00:00.000-04:00"),
    tasaUsdBs: s.tasaUsdBs,
  }));

  const errors = validateAll(mockRows);
  if (errors.length > 0) {
    console.error("❌ El archivo Excel tiene errores que violan las invariantes R1, R2 o R3:");
    errors.forEach(e => console.error(`  - [${e.rule}] ${e.message} (Fila ID: ${e.id})`));
    process.exit(1);
  }

  console.log("✅ Datos extraídos del Excel cumplen todas las validaciones.");
  
  fs.writeFileSync(SEED_DEST, JSON.stringify(seedData, null, 2));
  console.log(`✅ Archivo semilla actualizado con ${seedData.length} registros: ${SEED_DEST}`);
}

generateSeed();
