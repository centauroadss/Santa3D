/**
 * Pruebas integrales de robustez HTTP.
 *
 * Resultado esperado:
 *   - Post-fix: 3/3 PASS
 *   - Pre-fix:  0/3 (el código actual hace 1 sola petición sin reintentos)
 */

import { describe, it, expect, vi } from 'vitest';
import { fetchBcvHtml } from '@/lib/copa2026/bcv-sync';
import { makeBcvHtml } from '../helpers/bcv-mock';

describe('fetchBcvHtml — reintentos con backoff', () => {
  it('reintenta 3 veces antes de tener éxito y devuelve el HTML', async () => {
    const htmlOk = makeBcvHtml({
      year: 2026, month: 5, day: 15, tasa: '515,18000000',
    });
    const mockGet = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce({ status: 200, data: htmlOk });

    // Inyectamos un cliente fake; usamos retries=4 y aceleramos via fake timers
    vi.useFakeTimers({ shouldAdvanceTime: true, shouldAdvanceTimeBy: 100 });
    const html = await fetchBcvHtml(5, { get: mockGet });
    vi.useRealTimers();

    expect(html).toContain('USD');
    expect(html).toContain('Fecha Valor');
    expect(mockGet).toHaveBeenCalledTimes(4);
  }, 60_000);

  it('lanza tras 5 intentos fallidos', async () => {
    const mockGet = vi.fn().mockRejectedValue(new Error('ECONNRESET'));

    vi.useFakeTimers({ shouldAdvanceTime: true, shouldAdvanceTimeBy: 100 });
    await expect(fetchBcvHtml(5, { get: mockGet })).rejects.toThrow(
      /falló tras 5 intentos/
    );
    vi.useRealTimers();

    expect(mockGet).toHaveBeenCalledTimes(5);
  }, 60_000);

  it('rechaza HTML demasiado corto (página de mantenimiento)', async () => {
    const mockGet = vi
      .fn()
      .mockResolvedValue({ status: 200, data: '<h1>Down</h1>' });

    vi.useFakeTimers({ shouldAdvanceTime: true, shouldAdvanceTimeBy: 100 });
    await expect(fetchBcvHtml(2, { get: mockGet })).rejects.toThrow(
      /cuerpo vacío o muy corto/
    );
    vi.useRealTimers();
  }, 30_000);
});
