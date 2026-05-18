import { POST } from './app/api/copa2026/inscripcion/route';
import { vi } from 'vitest';

// 1. Mocks
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pagoMovil: { findUnique: vi.fn().mockResolvedValue(null) },
    inscripcionCopa2026: { findUnique: vi.fn().mockResolvedValue(null) },
    tasaBcvHistorico: {
      findFirst: vi.fn().mockResolvedValue({ tasaUsdBs: 55 }),
    },
  },
}));

vi.mock('@/lib/copa2026/ocr', () => ({
  validarComprobanteOcr: vi.fn().mockImplementation((buf, usd, ref, nom, ced, conf, fecha) => {
    // ESTA ES LA CLAVE: verificar que "fecha" no sea un objeto extraño sino la fecha (undefined o Date)
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
    uploadFile: vi.fn().mockResolvedValue('http://mock-s3/file.jpg'),
  },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

async function run() {
  console.log('Iniciando simulación del Request al endpoint POST...');
  
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
  // NO enviamos fechaPago para forzar el fallback a new Date() interno de ocr.ts
  
  // Dummy Files
  formData.append('comprobanteFile', new Blob(['fake image'], { type: 'image/png' }), 'comp.png');
  formData.append('fotoPerfilFile', new Blob(['fake image'], { type: 'image/png' }), 'foto.png');

  const req = new Request('http://localhost:3000/api/copa2026/inscripcion', {
    method: 'POST',
    body: formData,
  });

  try {
    const res = await POST(req);
    const json = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Body:', JSON.stringify(json, null, 2));
    
    if (res.status === 200 || res.status === 201) {
      console.log('✅ Éxito: El objeto Request cruzó toda la validación sin arrojar Invalid Date.');
    } else {
      console.log('❌ Falló con estado:', res.status);
    }
  } catch (error) {
    console.error('🔥 CRASH durante ejecución de POST:', error);
  }
}

run();
