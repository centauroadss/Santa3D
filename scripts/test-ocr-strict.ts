import { validarComprobanteOcr } from '../lib/copa2026/ocr';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function testOCR() {
  const imagePath = 'C:\\Users\\joaou\\.gemini\\antigravity\\brain\\6fc34806-7abc-4b61-8f73-2d2c1d7f6e42\\media__1779153244421.jpg';
  const buffer = fs.readFileSync(imagePath);
  
  console.log("Iniciando validación OCR estricta...");
  
  const result = await validarComprobanteOcr(
    buffer,
    5, // costoUsd
    '061263180373', // referenciaEsperada
    'raul dhoy', // nombreParticipante
    '11599999', // cedulaParticipante
    { banco: '0134', cedula: '18363359', telefono: '04241355408' }, // configPago
    new Date() // default as in the route.ts
  );
  
  console.log("==== RESULTADO FINAL ====");
  console.log("¿Es Válido?:", result.isValid);
  if (!result.isValid) {
    console.log("Motivo de fallo:", result.motivo);
  }
  
  console.log("\n==== CAMPOS DETECTADOS ====");
  console.log("Fecha detectada:", result.fechaExtraida);
  console.log("Monto detectado:", result.montoDetectado);
  console.log("Referencia detectada:", result.referenciaDetectada);
  console.log("Concepto detectado:", result.conceptoExtraido);
  console.log("Tasa usada:", result.tasaUsada);
  console.log("Monto esperado Bs:", result.montoEsperadoBs);
  
  console.log("\n==== VALIDACIONES CRUZADAS ====");
  console.log("Monto OK:", result.montoOk);
  console.log("Concepto OK:", result.conceptoOk);
  console.log("Referencia OK:", result.referenciaOk);
  console.log("Conformidad General:", result.conformidadGeneral);
}

testOCR()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
