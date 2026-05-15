import fs from 'fs';
import path from 'path';

const SEED_DEST = path.join(process.cwd(), 'prisma', 'seeds', 'bcv-historico.seed.json');
const SQL_DEST = path.join(process.cwd(), 'prisma', 'migrations', '03_force_reset.sql');

function generateSql() {
  const seedData = JSON.parse(fs.readFileSync(SEED_DEST, 'utf-8'));

  let sql = `-- 🚨 OPCIÓN NUCLEAR: Force Reset BCV 🚨
-- Ejecuta este script desde la consola para resetear la tabla a su estado canónico
-- Este script es transaccional (en MySQL, BEGIN y COMMIT).

BEGIN;

-- 1. Limpiar tabla (Borrado completo)
DELETE FROM tasa_bcv_historico;

-- 2. Insertar registros canónicos
INSERT INTO tasa_bcv_historico (fecha, fechaValor, tasaUsdBs, fechaEjecucion, fuenteUrl) VALUES
`;

  const values = seedData.map((row: any) => {
    return `('${row.fecha}', '${row.fechaValor}', ${row.tasaUsdBs}, NOW(), 'FORCE_RESET')`;
  });

  sql += values.join(',\n') + ';\n\n';
  sql += `-- 3. Si todo va bien (no hay duplicados o fallos de constraint) confirmamos.
COMMIT;
`;

  fs.writeFileSync(SQL_DEST, sql);
  console.log(`✅ Archivo SQL actualizado con ${seedData.length} registros: ${SQL_DEST}`);
}

generateSql();
