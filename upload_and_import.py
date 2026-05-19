import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

sftp = client.open_sftp()
local_excel_path = 'C:\\Users\\joaou\\OneDrive\\Documentos\\Tabla historica TC OFICIAL BCV.xlsx'
remote_excel_path = '/tmp/bcv.xlsx'
print("Subiendo archivo Excel...")
sftp.put(local_excel_path, remote_excel_path)
sftp.close()

# Copiar el excel al contenedor
client.exec_command('docker cp /tmp/bcv.xlsx $(docker ps -q --filter "name=project_copa2026.1"):/app/bcv.xlsx')

# Crear un pequeño script de importación para que lea de /app/bcv.xlsx
script = """
import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

function excelDateToJSDate(serial) {
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;
  date_info.setUTCHours(hours, minutes, seconds);
  return new Date(Date.UTC(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate()));
}

async function main() {
  const filePath = '/app/bcv.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: true });
  
  let importedCount = 0;
  for (const row of data) {
    const rawFechaEjecucion = row['Fecha de Ejecucion'];
    const rawFechaValor = row['Fecha Valor'];
    const rawTasa = row['Tasa Oficial BCV'];
    if (!rawFechaEjecucion || !rawFechaValor || !rawTasa) continue;

    const fecha = excelDateToJSDate(rawFechaEjecucion);
    const fechaValor = excelDateToJSDate(rawFechaValor);
    const tasa = parseFloat(rawTasa);

    try {
      await prisma.tasaBcvHistorico.upsert({
        where: { fecha },
        update: { tasaUsdBs: tasa, fechaValor },
        create: {
          fecha,
          fechaValor,
          tasaUsdBs: tasa,
          fechaEjecucion: new Date(),
          fuenteUrl: 'EXCEL_IMPORT',
        },
      });
      importedCount++;
    } catch (e) {
      console.error('Error insertando:', fecha, e.message);
    }
  }
  console.log(`Importacion correcta de ${importedCount} registros reales.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
"""

sftp = client.open_sftp()
with sftp.file('/tmp/run_import.ts', 'w') as f:
    f.write(script)
sftp.close()

client.exec_command('docker cp /tmp/run_import.ts $(docker ps -q --filter "name=project_copa2026.1"):/app/run_import.ts')

print("Ejecutando importacion en produccion...")
stdin, stdout, stderr = client.exec_command('docker exec $(docker ps -q --filter "name=project_copa2026.1") npx tsx /app/run_import.ts')
print("STDOUT:")
print(stdout.read().decode('utf-8'))
print("STDERR:")
print(stderr.read().decode('utf-8'))

client.close()
