/**
 * Tests unitarios de `lib/copa2026/validators.ts`.
 *
 * Cubre las reglas que el usuario pidió:
 *   - email con @ y estructura válida
 *   - instagram con @
 *   - teléfono venezolano con prefijos 412/422, 414/424, 416/426, máx 10 dígitos
 *   - cálculo de edad y mayoría de edad
 *   - biografía hasta 250 chars
 *   - concepto del pago contiene nombre + cédula
 *
 * Resultado esperado: 38/38 PASS.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidInstagram,
  validateVenezuelanPhone,
  calculateAge,
  esMayorDeEdad,
  validateBiografia,
  validateConcepto,
  costoUsdPorCategoria,
  BIOGRAFIA_MAX,
  EDAD_MINIMA,
} from '@/lib/copa2026/validators';

// ─── EMAIL ─────────────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it.each([
    'usuario@dominio.com',
    'usuario.con.punto@dominio.com',
    'usuario+tag@sub.dominio.co.ve',
    'a@b.cd',
  ])('acepta %s', (e) => expect(isValidEmail(e)).toBe(true));

  it.each([
    '',
    'sin-arroba.com',
    'usuario@',
    '@dominio.com',
    'usuario@dominio',
    'usuario@.com',
    'usuario@@dos.com',
    'con espacio@dominio.com',
  ])('rechaza "%s"', (e) => expect(isValidEmail(e)).toBe(false));
});

// ─── INSTAGRAM ─────────────────────────────────────────────────────────────

describe('isValidInstagram', () => {
  it.each(['@usuario', '@user.test', '@user_test', '@u123'])(
    'acepta %s',
    (s) => expect(isValidInstagram(s)).toBe(true)
  );

  it.each(['usuario', '@', '@usu ario', '@usu#ario', ''])(
    'rechaza "%s"',
    (s) => expect(isValidInstagram(s)).toBe(false)
  );
});

// ─── TELÉFONO ──────────────────────────────────────────────────────────────

describe('validateVenezuelanPhone', () => {
  it.each([
    ['04125551234', '04125551234'],
    ['04145551234', '04145551234'],
    ['04165551234', '04165551234'],
    ['04225551234', '04225551234'],
    ['04245551234', '04245551234'],
    ['04265551234', '04265551234'],
    ['+584125551234', '04125551234'],
    ['584125551234', '04125551234'],
    ['4125551234', '04125551234'],
  ])('acepta %s y normaliza a %s', (input, normalized) => {
    const r = validateVenezuelanPhone(input);
    expect(r.ok).toBe(true);
    expect(r.normalized).toBe(normalized);
  });

  it.each([
    '04135551234', // 413 no es prefijo válido
    '04155551234', // 415 no es prefijo válido
    '0412555123', // 9 dígitos
    '041255512345', // 11 dígitos
    'abc',
    '',
  ])('rechaza "%s"', (s) => {
    expect(validateVenezuelanPhone(s).ok).toBe(false);
  });
});

// ─── EDAD ──────────────────────────────────────────────────────────────────

describe('calculateAge y esMayorDeEdad', () => {
  it('cumpleaños exacto hace 18 años → 18', () => {
    const now = new Date('2026-05-15T00:00:00Z');
    const birth = new Date('2008-05-15');
    expect(calculateAge(birth, now)).toBe(18);
    expect(esMayorDeEdad(birth, now)).toBe(true);
  });

  it('cumple mañana → todavía 17', () => {
    const now = new Date('2026-05-15T00:00:00Z');
    const birth = new Date('2008-05-16');
    expect(calculateAge(birth, now)).toBe(17);
    expect(esMayorDeEdad(birth, now)).toBe(false);
  });

  it('fecha futura → 0', () => {
    const now = new Date('2026-05-15T00:00:00Z');
    expect(calculateAge('2030-01-01', now)).toBe(0);
  });

  it('string ISO funciona', () => {
    const now = new Date('2026-05-15T00:00:00Z');
    expect(calculateAge('1990-01-01', now)).toBe(36);
  });

  it('EDAD_MINIMA es 18', () => {
    expect(EDAD_MINIMA).toBe(18);
  });
});

// ─── BIOGRAFÍA ─────────────────────────────────────────────────────────────

describe('validateBiografia', () => {
  it('vacía falla', () => {
    expect(validateBiografia('').ok).toBe(false);
  });

  it('1 char ok', () => {
    expect(validateBiografia('a').ok).toBe(true);
  });

  it('exactamente 250 chars ok', () => {
    expect(validateBiografia('x'.repeat(BIOGRAFIA_MAX)).ok).toBe(true);
  });

  it('251 chars rechazado', () => {
    expect(validateBiografia('x'.repeat(BIOGRAFIA_MAX + 1)).ok).toBe(false);
  });

  it('reporta longitud actual', () => {
    expect(validateBiografia('hola mundo').length).toBe(10);
  });
});

// ─── CONCEPTO ──────────────────────────────────────────────────────────────

describe('validateConcepto', () => {
  it('concepto con nombre completo + cédula completa → ok', () => {
    const r = validateConcepto(
      'Juan Pérez V-12345678',
      'Juan Pérez',
      'V-12345678'
    );
    expect(r.ok).toBe(true);
  });

  it('case y acentos no importan', () => {
    const r = validateConcepto(
      'juan perez 12345678',
      'Juan Pérez',
      'V-12345678'
    );
    expect(r.ok).toBe(true);
    expect(r.details.tieneNombre).toBe(true);
    expect(r.details.tieneCedula).toBe(true);
  });

  it('falta cédula → rechazado', () => {
    const r = validateConcepto('Juan Pérez', 'Juan Pérez', 'V-12345678');
    expect(r.ok).toBe(false);
    expect(r.details.tieneNombre).toBe(true);
    expect(r.details.tieneCedula).toBe(false);
  });

  it('falta nombre → rechazado', () => {
    const r = validateConcepto('Pago 12345678', 'Juan Pérez', 'V-12345678');
    expect(r.ok).toBe(false);
    expect(r.details.tieneNombre).toBe(false);
    expect(r.details.tieneCedula).toBe(true);
  });

  it('genérico sin datos → rechazado', () => {
    const r = validateConcepto('Pago inscripcion', 'Juan Pérez', 'V-12345678');
    expect(r.ok).toBe(false);
  });

  it('apellido compuesto: detecta nombre + último apellido', () => {
    const r = validateConcepto(
      'Maria Lopez Garcia 87654321',
      'Maria Lopez Garcia',
      'V-87654321'
    );
    expect(r.ok).toBe(true);
  });
});

// ─── COSTO ─────────────────────────────────────────────────────────────────

describe('costoUsdPorCategoria', () => {
  it('RENDER → 5', () => expect(costoUsdPorCategoria('RENDER')).toBe(5));
  it('IA → 5', () => expect(costoUsdPorCategoria('IA')).toBe(5));
  it('AMBAS → 10', () => expect(costoUsdPorCategoria('AMBAS')).toBe(10));
});
