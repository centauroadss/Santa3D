/**
 * Pruebas unitarias de los parsers del HTML BCV.
 * No requieren BD ni red.
 *
 * Resultado esperado: 8/8 PASS (pre-fix y post-fix).
 */

import { describe, it, expect } from 'vitest';
import { parseFechaValor, parseTasaUsd } from '@/lib/copa2026/bcv-sync';

describe('parseFechaValor', () => {
  it('parsea con día de la semana acentuado', () => {
    const dt = parseFechaValor('Fecha Valor: Miércoles, 13 Mayo 2026');
    expect(dt.year).toBe(2026);
    expect(dt.month).toBe(5);
    expect(dt.day).toBe(13);
    expect(dt.zoneName).toBe('America/Caracas');
    expect(dt.hour).toBe(0);
  });

  it('es case-insensitive en el mes', () => {
    const dt = parseFechaValor('Fecha Valor: Jueves, 1 ENERO 2026');
    expect(dt.month).toBe(1);
    expect(dt.day).toBe(1);
  });

  it('lanza si no encuentra Fecha Valor', () => {
    expect(() => parseFechaValor('<div>nada</div>')).toThrow(/Fecha Valor/);
  });

  it('lanza si el mes es desconocido', () => {
    expect(() => parseFechaValor('Fecha Valor: Lunes, 5 Frebrero 2026')).toThrow(
      /mes desconocido/
    );
  });
});

describe('parseTasaUsd', () => {
  it('parsea formato venezolano con coma decimal', () => {
    expect(parseTasaUsd('USD 508,60040000')).toBeCloseTo(508.6004, 4);
  });

  it('parsea formato con miles', () => {
    expect(parseTasaUsd('USD 1.508,60040000')).toBeCloseTo(1508.6004, 4);
  });

  it('lanza si tasa es 0', () => {
    expect(() => parseTasaUsd('USD 0,00000000')).toThrow(/inválida/);
  });

  it('lanza si no encuentra USD', () => {
    expect(() => parseTasaUsd('EUR 596,60')).toThrow(/USD/);
  });
});
