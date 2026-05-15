import { Decimal } from '@prisma/client/runtime/library';

export interface BcvRow {
    id: number;
    fecha: Date;
    fechaValor: Date;
    tasaUsdBs: Decimal | number | string;
}

export interface InvariantViolation {
    id?: number;
    rule: string;
    message: string;
}

/**
 * Módulo de validación de invariantes para el histórico del BCV (V2)
 * R1 (fv_gt_fecha): La fecha valor debe ser estrictamente mayor a la fecha de ejecución.
 * R2 (unique_columns): La fecha, fecha valor y tasa deben ser únicas en todo el set.
 * R3 (cadena): La `fecha` de la fila N debe ser lógicamente consecutiva a la `fechaValor` de la fila N-1.
 */

// Helper para ignorar la hora (normalmente debería ser medianoche UTC)
function resetTime(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function validateR1(row: BcvRow): InvariantViolation | null {
    const dFecha = resetTime(row.fecha);
    const dFV = resetTime(row.fechaValor);

    if (dFV.getTime() <= dFecha.getTime()) {
        return {
            id: row.id,
            rule: 'R1.fv_gt_fecha',
            message: `fecha=${dFecha.toISOString().split('T')[0]} >= fechaValor=${dFV.toISOString().split('T')[0]}`
        };
    }
    return null;
}

export function validateR2(rows: BcvRow[]): InvariantViolation[] {
    const violations: InvariantViolation[] = [];
    const seenFechas = new Set<string>();
    const seenFechaValores = new Set<string>();
    const seenTasas = new Set<string>();

    for (const row of rows) {
        const dFechaStr = resetTime(row.fecha).toISOString().split('T')[0];
        const dFVStr = resetTime(row.fechaValor).toISOString().split('T')[0];
        const tasaStr = row.tasaUsdBs.toString();

        if (seenFechas.has(dFechaStr)) {
            violations.push({ id: row.id, rule: 'R2.unique_fecha', message: `Fecha duplicada: ${dFechaStr}` });
        }
        if (seenFechaValores.has(dFVStr)) {
            violations.push({ id: row.id, rule: 'R2.unique_fechaValor', message: `Fecha Valor duplicada: ${dFVStr}` });
        }
        if (seenTasas.has(tasaStr)) {
            violations.push({ id: row.id, rule: 'R2.unique_tasa', message: `Tasa duplicada: ${tasaStr}` });
        }

        seenFechas.add(dFechaStr);
        seenFechaValores.add(dFVStr);
        seenTasas.add(tasaStr);
    }

    return violations;
}

export function validateR3(rows: BcvRow[]): InvariantViolation[] {
    const violations: InvariantViolation[] = [];
    if (rows.length < 2) return violations;

    // Sort by fecha just in case
    const sorted = [...rows].sort((a, b) => resetTime(a.fecha).getTime() - resetTime(b.fecha).getTime());

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];

        const prevFV = resetTime(prev.fechaValor);
        const currFecha = resetTime(current.fecha);

        // Difference in days
        const diffMs = currFecha.getTime() - prevFV.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        // En un mundo ideal, diffDays === 0 (La fecha de ejecución actual ES la fechaValor anterior)
        // O si hay feriados, la fechaValor anterior cae un lunes, y la fecha actual es el martes (diffDays = 1, 2)
        // El bug principal de R3 es cuando se "rompe" la cadena porque hay solapamientos (diffDays < 0)
        // o si diffDays == 0 pero las fechas no cuadran estrictamente por gaps enormes.
        
        // Regla R3 estricta (según contexto): La fecha actual DEBE ser igual a la fechaValor de la anterior.
        // Ej: Fila1: fecha 04/05 -> FV 05/05. Fila2: fecha 05/05 -> FV 06/05. (diffDays = 0)
        // Los fines de semana el BCV tira FV=Lunes. (Ej: viernes 08/05 -> FV 11/05. Lunes 11/05 -> FV 12/05. diffDays = 0).
        if (diffDays !== 0) {
            violations.push({
                id: prev.id, // o current.id, se señala el gap
                rule: 'R3.cadena',
                message: `falta fila con fecha=${prevFV.toISOString().split('T')[0]} (esperada como sucesora de id=${prev.id})`
            });
        }
    }

    return violations;
}

export function validateAll(rows: BcvRow[]): InvariantViolation[] {
    const violations: InvariantViolation[] = [];

    for (const row of rows) {
        const r1 = validateR1(row);
        if (r1) violations.push(r1);
    }

    const r2 = validateR2(rows);
    violations.push(...r2);

    const r3 = validateR3(rows);
    violations.push(...r3);

    return violations;
}
