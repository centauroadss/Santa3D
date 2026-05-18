import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/copa2026/inscripcion/route';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pagoMovil: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
    inscripcionCopa2026: { findUnique: vi.fn().mockResolvedValue(null), findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
    tasaBcvHistorico: {
      findFirst: vi.fn().mockResolvedValue({ tasaUsdBs: 55 }),
    },
    $transaction: vi.fn(async (callback) => {
      // Execute the callback with the mocked prisma client
      return callback({
        pagoMovil: { create: vi.fn().mockResolvedValue({ id: 1 }) },
        inscripcionCopa2026: { create: vi.fn().mockResolvedValue({ id: 1 }) }
      });
    })
  },
}));

vi.mock('@/lib/copa2026/ocr', () => ({
  validarComprobanteOcr: vi.fn().mockImplementation((buf, usd, ref, nom, ced, conf, fecha) => {
    // Si la corrección está aplicada, "fecha" debe ser undefined (o new Date en la firma si está mockeada directamente)
    // Pero si el bug persiste, "fecha" será un objeto: { banco: ..., cedula: ..., telefono: ... }
    if (fecha !== undefined && !(fecha instanceof Date)) {
      throw new Error(`CRÍTICO: fechaPago se recibió como: ${JSON.stringify(fecha)}`);
    }
    return {
      isValid: true,
      montoAprobadoBs: 550,
      referenciaEncontrada: ref,
      rawJson: {},
    };
  }),
}));

vi.mock('@/lib/storage', () => ({
  StorageService: {
    saveFile: vi.fn().mockResolvedValue('http://mock-s3/file.jpg'),
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

describe('Verificación Directa de route.ts', () => {
  it('debe procesar el Request sin lanzar Error por Invalid Date en el motor OCR', async () => {
    const formData = new FormData();
    formData.append('nombre', 'Raul');
    formData.append('apellido', 'Dhoy');
    formData.append('cedulaIdentidad', 'V-11599999');
    formData.append('email', 'raul@test.com');
    formData.append('telefono', '04241234567');
    formData.append('instagram', '@rauldhoy');
    formData.append('fechaNacimiento', '1990-01-01');
    formData.append('categoria', 'RENDER');
    formData.append('biografia', 'Esta es una biografía de prueba con más de 50 caracteres para validación estricta.');
    formData.append('aceptaTerminos', 'true');
    formData.append('cesionDerechos', 'true');
    formData.append('confirmaMayoriaEdad', 'true');
    
    formData.append('bancoOrigen', 'BANESCO');
    formData.append('cedulaPago', 'V-11599999');
    formData.append('telefonoPago', '04241234567');
    formData.append('referencia', '12345678');
    formData.append('concepto', 'Raul Dhoy V-11599999');
    
    formData.append('comprobanteFile', new Blob(['fake image'], { type: 'image/png' }), 'comp.png');
    formData.append('fotoPerfilFile', new Blob(['fake image'], { type: 'image/png' }), 'foto.png');

    const req = new Request('http://localhost:3000/api/copa2026/inscripcion', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    const json = await res.json();
    
    // Si hubo éxito, el status debe ser 200 o 201 (NextResponse.json retorna 200 en este proyecto por defecto, o a veces 201)
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
  });
});
