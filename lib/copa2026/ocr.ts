/**
 * lib/copa2026/ocr.ts — V2 con preprocesamiento + extractores estructurados.
 *
 * Cambios respecto a la versión anterior:
 *   ★ Preprocesa la imagen con `sharp` (greyscale + normalize + threshold)
 *      ANTES de pasarla a Tesseract.
 *   ★ Ejecuta Tesseract sobre DOS variantes (binarizada + escala de grises)
 *      y se queda con la de mayor confianza.
 *   ★ Usa `extractAllFields()` línea-a-línea en vez de regex libre →
 *      captura referencia completa, monto, concepto, fecha, banco, cédula,
 *      teléfono destino.
 *   ★ Devuelve TODOS los campos como propiedades top-level (no escondidos
 *      en `rawJson`) para que el API los persista explícitamente.
 *   ★ Acepta tasa BCV via inyección (no la consulta directamente) — más
 *      testeable y desacoplado.
 *
 * Reemplaza completamente al archivo anterior.
 */

import Tesseract from 'tesseract.js';
import { prisma } from '@/lib/prisma';
import { DateTime } from 'luxon';
import { preprocessForOcr } from './ocr-preprocess';
import { extractAllFields, OcrFields } from './ocr-extractors';
import { validateConcepto, costoUsdPorCategoria } from './validators';

const TZ = 'America/Caracas';
const OCR_TIMEOUT_MS = 45_000;
const MARGEN_BS = 5.0;

export interface ValidacionResult {
  isValid: boolean;
  motivo?: string;

  // ── Campos extraídos top-level (persistir en BD explícitamente) ──
  montoDetectado: number | null;
  referenciaDetectada: string | null;
  conceptoExtraido: string | null;
  fechaExtraida: string | null;          // ISO YYYY-MM-DD
  cedulaReceptorDetectada: string | null;
  telefonoDestinoDetectado: string | null;
  bancoEmisorNombre: string | null;
  bancoEmisorCodigo: string | null;

  // ── Validaciones cruzadas ──
  referenciaOk: boolean;
  bancoOk: boolean;
  cedulaReceptorOk: boolean;
  montoOk: boolean;
  conceptoOk: boolean;
  conformidadGeneral: boolean;           // true si todas las anteriores

  // ── Metadata ──
  tasaUsada: number | null;
  montoEsperadoBs: number | null;
  confidence: number;
  rawJson: any;
}

export function normalizeImageInput(input: Buffer | string | Uint8Array): Buffer {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (typeof input === 'string') {
    const stripped = input.replace(/^data:image\/[\w+.-]+;base64,/i, '').trim();
    if (!/^[A-Za-z0-9+/=\s]+$/.test(stripped)) {
      throw new Error(`Image input no es Buffer ni base64 válido. Recibido: "${input.slice(0, 30)}..."`);
    }
    return Buffer.from(stripped, 'base64');
  }
  throw new Error(`Image input tipo no soportado: ${typeof input}`);
}

/**
 * Función principal que orquesta el OCR y la validación cruzada.
 *
 * @param imageInput    Imagen del pago a analizar (Buffer, string base64 o Uint8Array)
 * @param costoUsd      Monto esperado en dólares para la categoría
 * @param referenciaEsperada  Referencia que el participante reportó
 * @param nombreParticipante  Nombre+apellido para validar concepto
 * @param cedulaParticipante  Cédula para validar concepto
 * @param configPago    Datos del receptor configurado (banco/cédula/teléfono)
 * @param fechaPago     Fecha del pago (opcional; default hoy Caracas)
 */
export async function validarComprobanteOcr(
  imageInput: Buffer | string | Uint8Array,
  costoUsd: number,
  referenciaEsperada: string,
  nombreParticipante: string,
  cedulaParticipante: string,
  configPago: { banco?: string; cedula?: string; telefono?: string },
  fechaPago: Date = new Date()
): Promise<ValidacionResult> {

  const imageBuffer = normalizeImageInput(imageInput);

  // ─── 1. Preprocesar la imagen (DOS variantes) ────────────────────────
  let textBest = '';
  let confBest = 0;
  let variantUsed: string | null = null;

  try {
    const variants = await preprocessForOcr(imageBuffer);

    for (const v of variants) {
      const recog = Tesseract.recognize(v.buffer, 'spa+eng', {
        logger: () => {},
      });
      const timeout = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('OCR timeout')), OCR_TIMEOUT_MS)
      );
      try {
        const result = (await Promise.race([recog, timeout])) as Tesseract.RecognizeResult;
        const { text, confidence } = result.data;
        if (confidence > confBest) {
          confBest = confidence;
          textBest = text;
          variantUsed = v.variant;
        }
      } catch {
        // intentar siguiente variante
      }
    }
  } catch (e) {
    // sharp falló — caer al raw como último recurso
    try {
      const r = (await Tesseract.recognize(imageBuffer, 'spa+eng', {
        logger: () => {},
      })) as Tesseract.RecognizeResult;
      textBest = r.data.text;
      confBest = r.data.confidence;
      variantUsed = 'raw-fallback';
    } catch (e2) {
      return failResult(
        `OCR no pudo procesar la imagen: ${(e2 as Error).message}`,
        costoUsd
      );
    }
  }

  // ─── 2. Extractores estructurados ───────────────────────────────────
  const fields: OcrFields = extractAllFields(textBest);

  // ─── 3. Tasa BCV vigente para la fecha del pago ─────────────────────
  let finalFechaPago = fechaPago;
  if (fields.fechaPago) {
    const parsed = new Date(fields.fechaPago);
    if (!isNaN(parsed.getTime())) {
      finalFechaPago = parsed;
    }
  }
  const fechaPagoCaracas = DateTime.fromJSDate(finalFechaPago).setZone(TZ).startOf('day').toJSDate();
  const bcvRecord = await prisma.tasaBcvHistorico.findFirst({
    where: { fechaValor: { lte: fechaPagoCaracas } },
    orderBy: { fechaValor: 'desc' },
  });
  const tasaUsada = bcvRecord ? parseFloat(bcvRecord.tasaUsdBs.toString()) : null;
  const montoEsperadoBs = tasaUsada !== null ? tasaUsada * costoUsd : null;

  // ─── 4. Validaciones cruzadas ───────────────────────────────────────
  const referenciaOk =
    !!fields.referencia &&
    !!referenciaEsperada &&
    fields.referencia.endsWith(referenciaEsperada.replace(/\D/g, '').slice(-6));

  const bancoOk =
    !!configPago.banco &&
    !!fields.bancoEmisorNombre &&
    configPago.banco.toUpperCase().includes(fields.bancoEmisorNombre);

  const cedulaReceptorOk =
    !!configPago.cedula &&
    !!fields.cedulaReceptor &&
    fields.cedulaReceptor.replace(/\D/g, '') ===
      configPago.cedula.replace(/\D/g, '');

  const montoOk =
    fields.monto !== null &&
    montoEsperadoBs !== null &&
    fields.monto >= montoEsperadoBs - MARGEN_BS;

  const conceptoCheck = fields.concepto
    ? validateConcepto(fields.concepto, nombreParticipante, cedulaParticipante)
    : { ok: false, reason: 'No se extrajo concepto', details: { tieneNombre: false, tieneCedula: false } };
  const conceptoOk = conceptoCheck.ok;

  // ─── 5. Conformidad general ─────────────────────────────────────────
  // Mínimo aceptable: monto OK + (referencia OK O concepto OK).
  // Si referencia es ilegible pero concepto valida, aceptamos.
  const conformidadGeneral = montoOk && (referenciaOk || conceptoOk);
  const isValid = conformidadGeneral;

  // ─── 6. Resultado ────────────────────────────────────────────────────
  const motivo: string[] = [];
  if (!montoOk) motivo.push('monto no coincide o no se detectó');
  if (!referenciaOk) motivo.push('referencia no coincide o no se detectó');
  if (!conceptoOk) motivo.push(conceptoCheck.reason ?? 'concepto inválido');

  return {
    isValid,
    motivo: isValid ? undefined : motivo.join('; '),
    montoDetectado: fields.monto,
    referenciaDetectada: fields.referencia,
    conceptoExtraido: fields.concepto,
    fechaExtraida: fields.fechaPago,
    cedulaReceptorDetectada: fields.cedulaReceptor,
    telefonoDestinoDetectado: fields.telefonoDestino,
    bancoEmisorNombre: fields.bancoEmisorNombre,
    bancoEmisorCodigo: fields.bancoEmisorCodigo,
    referenciaOk,
    bancoOk,
    cedulaReceptorOk,
    montoOk,
    conceptoOk,
    conformidadGeneral,
    tasaUsada,
    montoEsperadoBs,
    confidence: confBest,
    rawJson: {
      mensaje: isValid ? 'OK' : 'Inconsistencias detectadas',
      variantUsed,
      textExtracted: textBest,
      fields,
      conceptoCheck,
      tasaUsada,
      fechaValorTasa: bcvRecord?.fechaValor ?? null,
      fechaPagoNormalizada: fechaPagoCaracas,
      montoEsperadoBs,
    },
  };
}

function failResult(motivo: string, costoUsd: number): ValidacionResult {
  return {
    isValid: false,
    motivo,
    montoDetectado: null,
    referenciaDetectada: null,
    conceptoExtraido: null,
    fechaExtraida: null,
    cedulaReceptorDetectada: null,
    telefonoDestinoDetectado: null,
    bancoEmisorNombre: null,
    bancoEmisorCodigo: null,
    referenciaOk: false,
    bancoOk: false,
    cedulaReceptorOk: false,
    montoOk: false,
    conceptoOk: false,
    conformidadGeneral: false,
    tasaUsada: null,
    montoEsperadoBs: null,
    confidence: 0,
    rawJson: { mensaje: motivo, costoUsd },
  };
}

// Re-export para retrocompatibilidad si otros archivos importan la versión anterior
export { extractAllFields } from './ocr-extractors';
export type { OcrFields } from './ocr-extractors';
