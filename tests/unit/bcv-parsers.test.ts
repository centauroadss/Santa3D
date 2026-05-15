import { describe, it, expect } from 'vitest';
import { parseFechaValor, parseTasaUsd } from '@/lib/copa2026/bcv-sync';

const HTML_FIXTURE = `
  <div>...USD 508,60040000...</div>
  <p>Fecha Valor: Miércoles, 13 Mayo 2026</p>
`;

describe('parseFechaValor', () => {
  it('parsea correctamente con día de la semana', () => {
    const dt = parseFechaValor(HTML_FIXTURE);
    expect(dt.year).toBe(2026);
    expect(dt.month).toBe(5);
    expect(dt.day).toBe(13);
    expect(dt.zoneName).toBe('America/Caracas');
    expect(dt.hour).toBe(0);
  });

  it('lanza si no encuentra Fecha Valor', () => {
    expect(() => parseFechaValor('<div>nada</div>')).toThrow(/Fecha Valor/);
  });

  it('lanza si el mes es desconocido', () => {
    const bad = 'Fecha Valor: Lunes, 1 Frebrero 2026';
    expect(() => parseFechaValor(bad)).toThrow(/mes desconocido/);
  });

  it('es case-insensitive en el mes', () => {
    const dt = parseFechaValor('Fecha Valor: Martes, 12 MAYO 2026');
    expect(dt.month).toBe(5);
  });
});

describe('parseTasaUsd', () => {
  it('parsea formato venezolano con coma decimal', () => {
    expect(parseTasaUsd(HTML_FIXTURE)).toBeCloseTo(508.60040000, 6);
  });

  it('parsea tasa con miles', () => {
    const html = 'USD 1.508,60040000';
    expect(parseTasaUsd(html)).toBeCloseTo(1508.60040000, 6);
  });

  it('lanza si no encuentra USD', () => {
    expect(() => parseTasaUsd('<div>EUR 596,60</div>')).toThrow(/USD/);
  });

  it('lanza si la tasa es 0 o negativa', () => {
    expect(() => parseTasaUsd('USD 0,00000000')).toThrow(/inválida/);
  });
});
