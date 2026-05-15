/**
 * Saneamiento de `tasa_bcv_historico`.
 *
 * Repara:
 *  - id=11: fecha=15/05 → 14/05 (era bug TZ del scraper)
 *  - id=1..7: fechaValor = next business day after fecha
 *
 * Ejecutar UNA SOLA VEZ:
 *   npx ts-node scripts/backfill-bcv.ts
 *
 * Antes de correr:
 *  1. Hacer backup de la BD.
 *  2. Revisar la query de pre-validación en 01_pre_unique_check.sql.
 */

import { DateTime } from 'luxon';
import { prisma } from '../lib/prisma';
import { validateAll } from '../lib/copa2026/bcv-invariants';

const TZ = 'America/Caracas';

function nextBusinessDay(d: Date): Date {
  let dt = DateTime.fromJSDate(d).setZone(TZ).plus({ days: 1 });
  while (dt.weekday === 6 || dt.weekday === 7) dt = dt.plus({ days: 1 });
  return dt.startOf('day').toJSDate();
}

function caracasDay(iso: string): Date {
  return DateTime.fromISO(iso, { zone: TZ }).startOf('day').toJSDate();
}

async function backfill() {
  console.log('=== BACKFILL tasa_bcv_historico (TRANSACCIONAL) ===\n');

  try {
    await prisma.$transaction(async (tx) => {
      // ─ 1. Corregir id=11: fecha=15/05 → 14/05 (bug TZ) ─
      const id11 = await tx.tasaBcvHistorico.findUnique({ where: { id: 11 } });
      if (id11 && +id11.fecha === +caracasDay('2026-05-15')) {
        await tx.tasaBcvHistorico.update({
          where: { id: 11 },
          data: { fecha: caracasDay('2026-05-14') },
        });
        console.log('✓ id=11 reparado: fecha 15/05 → 14/05');
      } else {
        console.log('· id=11 ya estaba correcto o no existe');
      }

      // ─ 2. Para id 1..7, shift fechaValor al siguiente día hábil ─
      for (const id of [1, 2, 3, 4, 5, 6, 7]) {
        const row = await tx.tasaBcvHistorico.findUnique({ where: { id } });
        if (!row) {
          console.log(`· id=${id} no existe, salto`);
          continue;
        }
        if (+row.fechaValor !== +row.fecha) {
          console.log(`· id=${id} ya tiene fechaValor distinta, salto`);
          continue;
        }
        const nuevoFv = nextBusinessDay(row.fecha);
        await tx.tasaBcvHistorico.update({
          where: { id },
          data: { fechaValor: nuevoFv },
        });
        console.log(
          `✓ id=${id}: fechaValor ${row.fechaValor.toISOString().slice(0, 10)} → ${nuevoFv
            .toISOString()
            .slice(0, 10)}`
        );
      }

      // ─ 3. Verificar validaciones V2 ─
      console.log('\n=== Validando Invariantes V2 ===');
      const allRows = await tx.tasaBcvHistorico.findMany({ orderBy: { fecha: 'asc' } });
      const violations = validateAll(allRows as any);

      if (violations.length > 0) {
        console.error(`❌ El backfill rompió ${violations.length} invariantes. Haciendo ROLLBACK.`);
        violations.forEach((v) => console.error(`  [${v.rule}] id=${v.id ?? '?'}: ${v.message}`));
        throw new Error('BACKFILL_VALIDATION_FAILED');
      } else {
        console.log('✅ Todas las invariantes validadas correctamente.');
      }
    });

    console.log('\n🎉 Backfill transaccional completado y consolidado.');
  } catch (error: any) {
    if (error.message === 'BACKFILL_VALIDATION_FAILED') {
      console.error('\n⚠️ Operación cancelada. La base de datos no fue modificada.');
    } else {
      console.error('\n❌ Error inesperado durante el backfill:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfill();

