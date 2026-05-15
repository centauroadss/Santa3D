import { describe, it, expect } from 'vitest';
import { validateR1, validateR2, validateR3, validateAll, BcvRow } from '../../lib/copa2026/bcv-invariants';
import { Decimal } from '@prisma/client/runtime/library';

// Helper to create a date easily
function d(iso: string) {
    return new Date(iso + 'T00:00:00.000Z');
}

function mockRow(id: number, fecha: string, fv: string, tasa: number): BcvRow {
    return {
        id,
        fecha: d(fecha),
        fechaValor: d(fv),
        tasaUsdBs: new Decimal(tasa)
    };
}

describe('BCV Invariants', () => {
    describe('R1: fv_gt_fecha', () => {
        it('debe fallar si fechaValor == fecha', () => {
            const row = mockRow(1, '2026-05-15', '2026-05-15', 500);
            const r = validateR1(row);
            expect(r).not.toBeNull();
            expect(r?.rule).toBe('R1.fv_gt_fecha');
        });

        it('debe fallar si fechaValor < fecha', () => {
            const row = mockRow(1, '2026-05-16', '2026-05-15', 500);
            const r = validateR1(row);
            expect(r).not.toBeNull();
        });

        it('debe pasar si fechaValor > fecha', () => {
            const row = mockRow(1, '2026-05-14', '2026-05-15', 500);
            const r = validateR1(row);
            expect(r).toBeNull();
        });
    });

    describe('R2: unique_columns', () => {
        it('debe detectar fechas duplicadas', () => {
            const rows = [
                mockRow(1, '2026-05-14', '2026-05-15', 500),
                mockRow(2, '2026-05-14', '2026-05-16', 501),
            ];
            const v = validateR2(rows);
            expect(v.some(r => r.rule === 'R2.unique_fecha')).toBe(true);
        });

        it('debe detectar FV duplicadas', () => {
            const rows = [
                mockRow(1, '2026-05-13', '2026-05-15', 500),
                mockRow(2, '2026-05-14', '2026-05-15', 501),
            ];
            const v = validateR2(rows);
            expect(v.some(r => r.rule === 'R2.unique_fechaValor')).toBe(true);
        });

        it('debe detectar tasas duplicadas', () => {
            const rows = [
                mockRow(1, '2026-05-13', '2026-05-14', 500),
                mockRow(2, '2026-05-14', '2026-05-15', 500),
            ];
            const v = validateR2(rows);
            expect(v.some(r => r.rule === 'R2.unique_tasa')).toBe(true);
        });

        it('no debe reportar error si todos son unicos', () => {
            const rows = [
                mockRow(1, '2026-05-13', '2026-05-14', 500),
                mockRow(2, '2026-05-14', '2026-05-15', 501),
            ];
            const v = validateR2(rows);
            expect(v.length).toBe(0);
        });
    });

    describe('R3: cadena', () => {
        it('debe reportar error si current.fecha != prev.fechaValor', () => {
            const rows = [
                mockRow(1, '2026-05-13', '2026-05-14', 500),
                mockRow(2, '2026-05-15', '2026-05-16', 501), // Salto, esperaba 14
            ];
            const v = validateR3(rows);
            expect(v.length).toBe(1);
            expect(v[0].rule).toBe('R3.cadena');
        });

        it('no debe reportar error si current.fecha == prev.fechaValor', () => {
            const rows = [
                mockRow(1, '2026-05-13', '2026-05-14', 500),
                mockRow(2, '2026-05-14', '2026-05-15', 501),
            ];
            const v = validateR3(rows);
            expect(v.length).toBe(0);
        });
    });

    describe('validateAll e integracion general', () => {
        it('debe reproducir el bug del screenshot', () => {
            const rows = [
                mockRow(8, '2026-05-13', '2026-05-14', 510.7873),
                mockRow(11, '2026-05-15', '2026-05-15', 515.1800),
            ];
            const v = validateAll(rows);
            
            // Falla R1 porque 15/05 == 15/05
            expect(v.some(r => r.rule === 'R1.fv_gt_fecha')).toBe(true);
            
            // Falla R3 porque falta el 14/05 (salto)
            expect(v.some(r => r.rule === 'R3.cadena')).toBe(true);
        });
    });
});
