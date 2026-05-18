/**
 * Preprocesamiento de imagen ANTES de pasarla a Tesseract.
 *
 * Razón: los recibos de Pago Móvil de Banesco/Mercantil/Venezuela tienen
 * fondos de color (verde, azul) con tipografía delgada. Tesseract en crudo
 * tiene tasa de error muy alta sobre esas imágenes.
 *
 * Pipeline:
 *   1. Convertir a escala de grises.
 *   2. Normalizar (estira el rango de luminosidad a 0–255).
 *   3. Aumentar nitidez (sharpen).
 *   4. Binarización con umbral adaptativo.
 *   5. Aumentar densidad (DPI virtual) para que las letras pequeñas se
 *      vean grandes a Tesseract.
 *
 * Requiere `sharp`: npm i sharp
 */

import sharp from 'sharp';

export interface PreprocessResult {
  buffer: Buffer;
  width: number;
  height: number;
  variant: 'binary' | 'greyscale-normalized';
}

/**
 * Devuelve DOS variantes preprocesadas. Tesseract corre sobre ambas y se queda
 * con la que dé mayor confianza.
 */
export async function preprocessForOcr(input: Buffer): Promise<PreprocessResult[]> {
  const meta = await sharp(input).metadata();
  const targetWidth = Math.max(1600, meta.width ?? 1000);

  // Variante 1: binarizada (mejor para texto sobre fondo de color)
  const binary = await sharp(input)
    .resize({ width: targetWidth, withoutEnlargement: false })
    .greyscale()
    .normalize()
    .sharpen({ sigma: 1.0 })
    .threshold(135) // umbral; ajustar entre 120-145 si hay regresiones
    .png()
    .toBuffer();

  // Variante 2: escala de grises sin binarizar (mejor para fuentes muy finas)
  const grey = await sharp(input)
    .resize({ width: targetWidth, withoutEnlargement: false })
    .greyscale()
    .normalize()
    .linear(1.2, -15) // ↑ contraste leve
    .sharpen({ sigma: 0.8 })
    .png()
    .toBuffer();

  const binaryMeta = await sharp(binary).metadata();
  const greyMeta = await sharp(grey).metadata();

  return [
    {
      buffer: binary,
      width: binaryMeta.width ?? targetWidth,
      height: binaryMeta.height ?? 0,
      variant: 'binary',
    },
    {
      buffer: grey,
      width: greyMeta.width ?? targetWidth,
      height: greyMeta.height ?? 0,
      variant: 'greyscale-normalized',
    },
  ];
}
