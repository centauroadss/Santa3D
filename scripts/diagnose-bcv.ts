import { PrismaClient } from '@prisma/client';
import { validateAll, InvariantViolation } from '../lib/copa2026/bcv-invariants';

const prisma = new PrismaClient();

async function main() {
    console.log("=== Diagnóstico tasa_bcv_historico ===");
    
    // Obtenemos todas las filas
    const rows = await prisma.tasaBcvHistorico.findMany({
        orderBy: { fecha: 'asc' }
    });

    console.log(`Filas totales: ${rows.length}`);
    if (rows.length === 0) {
        console.log("No hay datos en la tabla.");
        process.exit(0);
    }

    console.log("id  | fecha       | fechaValor  | tasaUsdBs       | cadena");
    console.log("----+-------------+-------------+-----------------+-------");

    // Ejecutar validaciones
    const violations = validateAll(rows);

    // Mapear violaciones R3 (cadena) por id para mostrar en la tabla
    const r3ViolationsByPrevId = new Set<number>();
    violations.filter(v => v.rule === 'R3.cadena' && v.id !== undefined).forEach(v => {
        r3ViolationsByPrevId.add(v.id!);
    });

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fechaStr = new Date(row.fecha).toISOString().split('T')[0];
        const fvStr = new Date(row.fechaValor).toISOString().split('T')[0];
        const tasaStr = row.tasaUsdBs.toString().padEnd(15, ' ');
        const idStr = row.id.toString().padStart(3, ' ');

        let cadenaIcon = "✅";
        if (i === rows.length - 1) {
            cadenaIcon = "· (última)";
        } else if (r3ViolationsByPrevId.has(row.id)) {
            cadenaIcon = "❌";
        }

        console.log(`${idStr} | ${fechaStr}  | ${fvStr}  | ${tasaStr} | ${cadenaIcon}`);
    }

    if (violations.length === 0) {
        console.log("✅ Todas las invariantes (R1, R2, R3) se cumplen.");
        process.exit(0);
    } else {
        console.log(`\n❌ ${violations.length} violación(es) detectada(s):`);
        violations.forEach(v => {
            console.log(`  [${v.rule}] id=${v.id ?? '?'}: ${v.message}`);
        });
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
