/**
 * Tests integrales del endpoint POST /api/copa2026/inscripcion.
 *
 * Valida:
 *   - Acepta inscripción válida (biografia, concepto correcto, mayor de edad).
 *   - Rechaza biografía > 250 chars.
 *   - Rechaza concepto sin nombre o sin cédula.
 *   - Rechaza menor de edad incluso si check `confirmaMayoriaEdad` es true.
 *   - Persiste edadAlInscribir, biografia, concepto, conceptoValidado.
 *   - Rechaza duplicado por cédula.
 *
 * Requiere DATABASE_URL apuntando a BD de tests + OCR mockeable.
 *
 * Resultado esperado: 6/6 PASS post-fix.
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { POST } from '@/app/api/copa2026/inscripcion/route';
import { prisma } from '@/lib/prisma';

// Mock del OCR para devolver siempre éxito con el monto esperado.
vi.mock('@/lib/copa2026/ocr', () => ({
  validarComprobanteOcr: vi.fn(async (_b64, costoUsd) => ({
    isValid: true,
    montoDetectado: costoUsd * 500,
    rawJson: { mensaje: 'OK (mock)' },
  })),
}));

// Mock del storage.
vi.mock('@/lib/storage', () => ({
  StorageService: {
    saveFile: vi.fn(async (_buf, name) => `https://s3.test/${name}`),
  },
}));

function makeFormData(overrides: Record<string, any> = {}) {
  const fd = new FormData();
  const defaults: Record<string, any> = {
    nombre: 'Juan',
    apellido: 'Pérez',
    cedulaIdentidad: 'V-12345678',
    email: 'juan@test.com',
    telefono: '04125551234',
    instagram: '@juantest',
    fechaNacimiento: '1990-01-01',
    categoria: 'RENDER',
    biografia: 'Diseñador 3D con 10 años de experiencia.',
    aceptaTerminos: 'true',
    cesionDerechos: 'true',
    confirmaMayoriaEdad: 'true',
    bancoOrigen: 'Banesco',
    cedulaPago: 'V-11111111',
    telefonoPago: '04145551234',
    referencia: '987654321',
    concepto: 'Juan Pérez V-12345678',
    ...overrides,
  };
  for (const [k, v] of Object.entries(defaults)) fd.append(k, String(v));
  fd.append('comprobanteFile', new File(['c'], 'comp.jpg', { type: 'image/jpeg' }));
  fd.append('fotoPerfilFile', new File(['f'], 'foto.jpg', { type: 'image/jpeg' }));
  return fd;
}

function makeRequest(fd: FormData): Request {
  return new Request('http://localhost/api/copa2026/inscripcion', {
    method: 'POST',
    body: fd,
  });
}

describe('POST /api/copa2026/inscripcion', () => {
  beforeEach(async () => {
    await prisma.pagoMovil.deleteMany({});
    await prisma.inscripcionCopa2026.deleteMany({});
  });
  afterAll(async () => {
    await prisma.pagoMovil.deleteMany({});
    await prisma.inscripcionCopa2026.deleteMany({});
    await prisma.$disconnect();
  });

  it('acepta inscripción válida y persiste todos los campos nuevos', async () => {
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const insc = await prisma.inscripcionCopa2026.findFirst({
      include: { pago: true },
    });
    expect(insc).not.toBeNull();
    expect(insc!.biografia).toBe('Diseñador 3D con 10 años de experiencia.');
    expect(insc!.confirmaMayoriaEdad).toBe(true);
    expect(insc!.edadAlInscribir).toBeGreaterThanOrEqual(35);
    expect(insc!.pago!.concepto).toBe('Juan Pérez V-12345678');
    expect(insc!.pago!.conceptoValidado).toBe(true);
  });

  it('rechaza biografía > 250 chars', async () => {
    const fd = makeFormData({ biografia: 'a'.repeat(300) });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.campos.some((c: string) => c.startsWith('biografia'))).toBe(true);
  });

  it('rechaza concepto que no contiene la cédula', async () => {
    const fd = makeFormData({ concepto: 'Juan Pérez (sin cedula)' });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.campos.some((c: string) => c.startsWith('concepto'))).toBe(true);
  });

  it('rechaza concepto que no contiene el nombre', async () => {
    const fd = makeFormData({ concepto: 'Pago 12345678' });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
  });

  it('rechaza menor de edad aunque envíe confirmaMayoriaEdad=true', async () => {
    const hoy = new Date();
    const fechaMenor = `${hoy.getFullYear() - 15}-01-01`;
    const fd = makeFormData({ fechaNacimiento: fechaMenor });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.campos).toContain('mayoriaEdad');
  });

  it('rechaza duplicado por cédula', async () => {
    await POST(makeRequest(makeFormData()));
    const r2 = await POST(
      makeRequest(makeFormData({ email: 'otro@test.com', referencia: '111222333' }))
    );
    expect(r2.status).toBe(409);
  });
});
