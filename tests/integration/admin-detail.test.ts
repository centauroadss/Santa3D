/**
 * Tests integrales del endpoint GET /api/admin/inscripciones/[id].
 *
 * Valida que el detalle expone TODOS los campos que el admin necesita ver:
 *   - createdAt (timestamp)
 *   - fotoPerfilUrl
 *   - datos personales completos
 *   - comprobanteUrl
 *   - banco, referencia, monto, concepto + flag conceptoValidado
 *   - categoría
 *   - lista de videos con sus URLs reproducibles
 *
 * Resultado esperado: 5/5 PASS.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET } from '@/app/api/admin/inscripciones/[id]/route';
import { prisma } from '@/lib/prisma';

let inscripcionId: number;

beforeAll(async () => {
  await prisma.pagoMovil.deleteMany({});
  await prisma.inscripcionCopa2026.deleteMany({});

  const insc = await prisma.inscripcionCopa2026.create({
    data: {
      nombre: 'Juan',
      apellido: 'Pérez',
      cedulaIdentidad: 'V-12345678',
      email: 'juan@test.com',
      telefono: '04125551234',
      instagram: '@juantest',
      fechaNacimiento: new Date('1990-01-01'),
      categoria: 'AMBAS',
      fotoPerfilUrl: 'https://s3.test/foto.jpg',
      biografia: 'Diseñador 3D con experiencia internacional.',
      edadAlInscribir: 36,
      confirmaMayoriaEdad: true,
      aceptaTerminos: true,
      cesionDerechos: true,
      tokenVideo: 'tok-test-123',
      tokenExpiry: new Date(Date.now() + 14 * 86400000),
      estatusInscripcion: 'APROBADO',
      estatusToken: 'ACTIVO',
      pago: {
        create: {
          bancoOrigenCodigo: 'Banesco',
          cedulaPago: 'V-11111111',
          telefonoPago: '04145551234',
          referencia: '987654321',
          concepto: 'Juan Pérez V-12345678',
          conceptoValidado: true,
          montoCapturadoBs: 5151.80 as any,
          comprobanteUrl: 'https://s3.test/comp.jpg',
          fileHash: 'hash-test',
          ocrJson: { mensaje: 'OK' } as any,
        },
      },
      videos: {
        createMany: {
          data: [
            {
              rutaS3: 'https://s3.test/v1.mp4',
              nombreArchivo: 'render-final.mp4',
              tamanoBytes: BigInt(123456),
              duracionSeg: 60,
              resolucion: '1920x1080',
              fps: 30,
              formato: 'video/mp4',
              warnings: [],
              estatus: 'RECIBIDO',
            },
            {
              rutaS3: 'https://s3.test/v2.mp4',
              nombreArchivo: 'ia-final.mp4',
              tamanoBytes: BigInt(234567),
              duracionSeg: 45,
              resolucion: '3840x2160',
              fps: 60,
              formato: 'video/mp4',
              warnings: [],
              estatus: 'RECIBIDO',
            },
          ],
        },
      },
    },
  });
  inscripcionId = insc.id;
});

afterAll(async () => {
  await prisma.pagoMovil.deleteMany({});
  await prisma.inscripcionCopa2026.deleteMany({});
  await prisma.$disconnect();
});

describe('GET /api/admin/inscripciones/[id]', () => {
  it('devuelve los datos del participante completos', async () => {
    const res = await GET(new Request('http://x'), {
      params: { id: String(inscripcionId) },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.participante.nombre).toBe('Juan');
    expect(json.participante.apellido).toBe('Pérez');
    expect(json.participante.fotoPerfilUrl).toBe('https://s3.test/foto.jpg');
    expect(json.participante.biografia).toMatch(/Diseñador 3D/);
    expect(json.participante.edadAlInscribir).toBe(36);
    expect(json.participante.confirmaMayoriaEdad).toBe(true);
  });

  it('incluye fecha y hora de inscripción', async () => {
    const res = await GET(new Request('http://x'), {
      params: { id: String(inscripcionId) },
    });
    const json = await res.json();
    expect(json.createdAt).toBeDefined();
    expect(new Date(json.createdAt).getTime()).toBeGreaterThan(0);
  });

  it('incluye los datos del pago + flag conceptoValidado', async () => {
    const res = await GET(new Request('http://x'), {
      params: { id: String(inscripcionId) },
    });
    const json = await res.json();
    expect(json.pago.banco).toBe('Banesco');
    expect(json.pago.referencia).toBe('987654321');
    expect(json.pago.concepto).toBe('Juan Pérez V-12345678');
    expect(json.pago.conceptoValidado).toBe(true);
    expect(json.pago.comprobanteUrl).toBe('https://s3.test/comp.jpg');
    expect(parseFloat(json.pago.montoBs)).toBeCloseTo(5151.8, 1);
  });

  it('lista los videos con URLs reproducibles', async () => {
    const res = await GET(new Request('http://x'), {
      params: { id: String(inscripcionId) },
    });
    const json = await res.json();
    expect(json.videos).toHaveLength(2);
    expect(json.videos[0].rutaS3).toBe('https://s3.test/v1.mp4');
    expect(json.videos[1].rutaS3).toBe('https://s3.test/v2.mp4');
    expect(json.videos[0].nombreArchivo).toBe('render-final.mp4');
  });

  it('devuelve 404 si id no existe', async () => {
    const res = await GET(new Request('http://x'), {
      params: { id: '999999' },
    });
    expect(res.status).toBe(404);
  });
});
