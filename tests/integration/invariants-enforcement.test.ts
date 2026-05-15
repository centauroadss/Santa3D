import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { syncBcv } from '@/lib/copa2026/bcv-sync';

// Integration test for BCV invariants.
describe('Invariants Enforcement (Integration)', () => {
    beforeAll(async () => {
        // Clean the table to start fresh
        await prisma.tasaBcvHistorico.deleteMany();
    });

    afterAll(async () => {
        // Clean the table after we're done
        await prisma.tasaBcvHistorico.deleteMany();
        await prisma.$disconnect();
    });

    it('syncBcv should skip when fechaValor <= fecha', async () => {
        // Mock fetcher that returns a FV equal to "today"
        const now = new Date('2026-05-15T10:00:00Z'); // Caracas 2026-05-15
        const mockHtml = `
            Fecha Valor: Caracas, 15 Mayo 2026
            USD 515,1800
        `;

        const result = await syncBcv(now, async () => mockHtml);

        expect(result.skipped).toBe(true);
        
        // Verify no rows were inserted
        const count = await prisma.tasaBcvHistorico.count();
        expect(count).toBe(0);
    });

    it('Database CHECK constraint should block inserts where fechaValor <= fecha', async () => {
        // Attempt raw insertion that violates R1
        const invalidRow = {
            fecha: new Date('2026-05-15T00:00:00Z'),
            fechaValor: new Date('2026-05-15T00:00:00Z'),
            tasaUsdBs: 515.18,
            fechaEjecucion: new Date()
        };

        await expect(
            prisma.tasaBcvHistorico.create({ data: invalidRow })
        ).rejects.toThrow(); // Prisma throws error due to constraint violation
    });

    it('Valid row should be inserted and second identical insert should be blocked by unique', async () => {
        const validRow = {
            fecha: new Date('2026-05-14T00:00:00Z'),
            fechaValor: new Date('2026-05-15T00:00:00Z'),
            tasaUsdBs: 510.78,
            fechaEjecucion: new Date()
        };

        const inserted = await prisma.tasaBcvHistorico.create({ data: validRow });
        expect(inserted.id).toBeDefined();

        await expect(
            prisma.tasaBcvHistorico.create({ data: validRow })
        ).rejects.toThrow(); // Unique constraint violation on fecha, fechaValor, or tasaUsdBs
    });
});
