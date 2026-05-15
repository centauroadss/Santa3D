/**
 * PROTOCOLO FORCE RESET (OPCIÓN NUCLEAR)
 * 
 * Uso: 
 *   npx ts-node scripts/force-reset-bcv.ts
 *   npx ts-node scripts/force-reset-bcv.ts --execute
 */
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { validateAll } from '../lib/copa2026/bcv-invariants';
import seedData from '../prisma/seeds/bcv-historico.seed.json';

async function main() {
  const isExecute = process.argv.includes('--execute');

  if (!isExecute) {
    console.log("=== DRY RUN MODE ===");
    console.log("To actually execute the force reset, run with --execute");
    console.log("Seed data that will be inserted:");
    console.table(seedData);
    return;
  }

  console.log("🚨 INICIANDO FORCE RESET (Opción Nuclear) 🚨");

  // Backup current state
  const currentState = await prisma.tasaBcvHistorico.findMany();
  const timestamp = Date.now();
  const backupPath = path.join(process.cwd(), `bcv-backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(currentState, null, 2));
  console.log(`✅ Backup guardado en: ${backupPath}`);

  try {
    await prisma.$transaction(async (tx) => {
      console.log("🗑️  Truncating table...");
      await tx.tasaBcvHistorico.deleteMany();

      console.log(`🌱 Insertando ${seedData.length} registros canónicos...`);
      for (const row of seedData) {
        await tx.tasaBcvHistorico.create({
          data: {
            fecha: new Date(row.fecha + "T00:00:00.000-04:00"),
            fechaValor: new Date(row.fechaValor + "T00:00:00.000-04:00"),
            tasaUsdBs: row.tasaUsdBs,
            fechaEjecucion: new Date(),
            fuenteUrl: "FORCE_RESET",
          }
        });
      }

      console.log("🔎 Validando invariantes dentro de la transacción...");
      const newlyInserted = await tx.tasaBcvHistorico.findMany({ orderBy: { fecha: 'asc' } });
      const errors = validateAll(newlyInserted);

      if (errors.length > 0) {
        console.error("❌ ERROR DURANTE VALIDACIÓN. Haciendo ROLLBACK...");
        errors.forEach(e => console.error(`  - ${e.message}`));
        throw new Error("Violación de invariantes detectada");
      }
    });

    console.log("✅ TRANSACCIÓN EXITOSA. Reseteo completo.");
    console.log("✅ Todas las invariantes (R1, R2, R3) se cumplen.");
  } catch (error) {
    console.error("❌ TRANSACCIÓN FALLIDA. Se aplicó ROLLBACK.");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
