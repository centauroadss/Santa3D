import { validarComprobanteOcr } from './lib/copa2026/ocr';
import fs from 'fs';
import path from 'path';

// Mocking prisma before importing ocr.ts would be hard if it's already imported.
// But we can mock `prisma.tasaBcvHistorico.findFirst` directly.
import { prisma } from './lib/prisma';

prisma.tasaBcvHistorico.findFirst = async () => ({
  id: 1,
  fechaValor: new Date(),
  tasaUsdBs: 40.0,
  fuente: 'TEST',
  createdAt: new Date(),
  updatedAt: new Date()
}) as any;

async function main() {
  const imagePath = path.join(process.cwd(), 'dummy.jpg');
  if (!fs.existsSync(imagePath)) {
    console.error("dummy.jpg not found");
    return;
  }
  const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });

  console.log("Running OCR test on dummy.jpg...");
  const costoUsd = 10;
  const referenciaEsperada = "180373";
  const nombre = "Raul";
  const apellido = "Dhoy";
  const cedula = "11599999";
  const configPago = { banco: "0134", cedula: "0000", telefono: "0000" };

  const result = await validarComprobanteOcr(
      base64Image,
      costoUsd,
      referenciaEsperada,
      nombre,
      apellido,
      cedula,
      configPago
  );

  console.log(JSON.stringify(result, null, 2));
}

main();
