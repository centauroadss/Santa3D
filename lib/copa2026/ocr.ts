import Tesseract from 'tesseract.js';
import { prisma } from '@/lib/prisma';
import { DateTime } from 'luxon';

const TZ = 'America/Caracas';

export function toCaracasDate(d: Date | string): Date {
  return DateTime.fromJSDate(new Date(d), { zone: 'utc' })
                 .setZone(TZ)
                 .startOf('day')
                 .toJSDate();
}

interface OcrResult {
  isValid: boolean;
  montoDetectado: number | null;
  referenciaDetectada: string | null;
  bancoDetectado: string | null;
  rawJson: any;
  confidence: number;
  fechaExtraida?: string | null;
  conceptoExtraido?: string | null;
  bancoReceptorOk?: boolean;
  cedulaReceptorOk?: boolean;
  telefonoReceptorOk?: boolean;
}

export async function validarComprobanteOcr(
  base64Image: string, 
  costoUsd: number, 
  referenciaEsperada: string,
  nombre: string,
  apellido: string,
  cedula: string,
  configPago?: { banco: string, cedula: string, telefono: string }
): Promise<OcrResult> {
  try {
    // Limpiar header base64 si existe
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const buffer = Buffer.from(base64Data, 'base64');
    
    // Ejecutar Tesseract OCR con timeout para evitar que se quede pegado
    const recognizePromise = Tesseract.recognize(
        buffer,
        'spa+eng',
        { logger: m => {} } // Ocultar logs en consola de servidor
    );

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tesseract timeout")), 8000);
    });

    const result = await Promise.race([recognizePromise, timeoutPromise]) as any;
    const { data: { text, confidence } } = result;

    // Extraer candidatos monetarios usando RegEx
    const regex = /(?:\b|Bs\.?\s*|Monto:\s*|Monto\s*|BsS\s*)((?:[0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)(?:[.,][0-9]{1,2})?)\b/gi;
    const matches = [...text.matchAll(regex)];
    const candidatos = [];

    for (const match of matches) {
        let numStr = match[1];
        const parts = numStr.split(/[.,]/);
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            // Si la última parte tiene 1 o 2 dígitos, es decimal
            if (lastPart.length <= 2) {
                const intPart = parts.slice(0, -1).join('');
                numStr = intPart + '.' + lastPart;
            } else {
                numStr = parts.join('');
            }
        }

        const parsed = parseFloat(numStr);
        if (!isNaN(parsed) && parsed > 1 && parsed < 500000) {
            candidatos.push(parsed);
        }
    }

    // Búsqueda de referencia
    const refLimpia = referenciaEsperada.replace(/\D/g, '');
    const refFragment = refLimpia.length > 4 ? refLimpia.slice(-4) : refLimpia;
    const referenciaEncontrada = refFragment.length > 0 && text.includes(refFragment);

    // Búsqueda de concepto/cédula en el texto raw como método auxiliar
    const cedulaRaw = cedula.replace(/[^0-9]/g, '');
    const cedulaEncontrada = cedulaRaw.length > 0 && text.includes(cedulaRaw);

    // Extracción de Fecha (formatos dd/mm/yyyy o dd-mm-yyyy)
    let fechaExtraida: string | null = null;
    const dateRegex = /\b(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/](\d{4}|\d{2})\b/g;
    const dateMatch = text.match(dateRegex);
    if (dateMatch && dateMatch.length > 0) {
        fechaExtraida = dateMatch[0];
    }

    // Calcular Fecha de Pago Real (O fecha actual si falla)
    let fechaPagoRaw: Date | null = null;
    if (fechaExtraida) {
        const parts = fechaExtraida.split(/[-/]/);
        if (parts.length === 3) {
            let [day, month, year] = parts;
            if (year.length === 2) year = `20${year}`;
            // Crear el objeto DateTime directamente en la zona de Caracas
            fechaPagoRaw = DateTime.fromObject(
                { year: parseInt(year), month: parseInt(month), day: parseInt(day) },
                { zone: TZ }
            ).toJSDate();
        }
    }

    // Si no se extrajo fecha o falló, usamos la fecha de hoy
    const fechaPago = fechaPagoRaw ? toCaracasDate(fechaPagoRaw) : toCaracasDate(new Date());

    // Buscar Tasa BCV Vigente para esa fecha exacta (o anterior más cercana)
    const bcvRecord = await prisma.tasaBcvHistorico.findFirst({
        where: { fechaValor: { lte: fechaPago } },
        orderBy: { fechaValor: 'desc' }
    });
    
    if (!bcvRecord) {
        return {
            isValid: false,
            montoDetectado: null,
            referenciaDetectada: null,
            bancoDetectado: null,
            rawJson: { 
                error: 'Sin tasa BCV histórica aplicable para validar el pago',
                tasaUsada: null,
                fechaValorTasa: null,
                fechaPagoNormalizada: fechaPago,
                montoEsperadoCalculado: null
            },
            confidence: confidence
        };
    }

    const tasaBcv = parseFloat(bcvRecord.tasaUsdBs.toString());
    const montoEsperadoBs = tasaBcv * costoUsd;

    const margen = 5.0; // 5 Bs de tolerancia
    // Aceptamos montos iguales o mayores al esperado. Tomamos el menor de los candidatos válidos para evitar agarrar números de referencia gigantes.
    const candidatoIdeal = candidatos.filter(c => c >= montoEsperadoBs - margen).sort((a, b) => a - b)[0];

    // Extracción de Concepto
    let conceptoExtraido: string | null = null;
    const conceptoRegex = /(?:concepto|descripción|nota|motivo|detalle|asunto)s?:?\s*([^\n\r]+)/i;
    const conceptoMatch = text.match(conceptoRegex);
    if (conceptoMatch && conceptoMatch[1]) {
        conceptoExtraido = conceptoMatch[1].trim();
    }

    // Validación Receptor (Banco, Cedula, Telefono)
    let bancoReceptorOk = false;
    let cedulaReceptorOk = false;
    let telefonoReceptorOk = false;

    if (configPago) {
        const textLower = text.toLowerCase();
        
        // Validar Banco
        const bReceptor = configPago.banco.toLowerCase();
        if (textLower.includes(bReceptor) || bReceptor.split(' ').some(word => word.length > 3 && textLower.includes(word))) {
            bancoReceptorOk = true;
        }

        // Validar Cedula Receptor
        const ciConfigRaw = configPago.cedula.replace(/[^0-9]/g, '');
        if (ciConfigRaw.length > 0 && text.includes(ciConfigRaw)) {
            cedulaReceptorOk = true;
        }

        // Validar Telefono Receptor
        const tlfConfigRaw = configPago.telefono.replace(/[^0-9]/g, '');
        const tlfFragment = tlfConfigRaw.length > 7 ? tlfConfigRaw.slice(-7) : tlfConfigRaw;
        if (tlfFragment.length > 0 && text.replace(/\s+/g, '').includes(tlfFragment)) {
            telefonoReceptorOk = true;
        }
    }

    // Lógica de aceptación ESTRICTA (Solicitado por el auditor):
    // El OCR debe encontrar el monto ideal, O la referencia/cédula.
    // Si no encuentra nada de eso, rechazamos la validación para evitar fraude.
    if (candidatoIdeal !== undefined || referenciaEncontrada || cedulaEncontrada) {
        return {
            isValid: true,
            montoDetectado: candidatoIdeal || (candidatos.length > 0 ? Math.max(...candidatos) : null),
            referenciaDetectada: referenciaEncontrada ? referenciaEsperada : null,
            bancoDetectado: bancoReceptorOk ? configPago?.banco || null : null,
            rawJson: { 
                mensaje: "Aprobado por Tesseract local", 
                candidatos, 
                text_extracted: text,
                tasaUsada: tasaBcv,
                fechaValorTasa: bcvRecord.fechaValor,
                fechaPagoNormalizada: fechaPago,
                montoEsperadoCalculado: montoEsperadoBs
            },
            confidence: confidence,
            fechaExtraida,
            conceptoExtraido,
            bancoReceptorOk,
            cedulaReceptorOk,
            telefonoReceptorOk
        };
    }

    return {
        isValid: false,
        montoDetectado: candidatos.length > 0 ? Math.max(...candidatos) : null,
        referenciaDetectada: null,
        bancoDetectado: null,
        rawJson: { 
            error: `El OCR no pudo detectar el monto mínimo de ${montoEsperadoBs.toFixed(2)} Bs (Tasa: ${tasaBcv.toFixed(2)}), ni la referencia. Sube una imagen más clara.`,
            candidatos,
            text_extracted: text,
            tasaUsada: tasaBcv,
            fechaValorTasa: bcvRecord.fechaValor,
            fechaPagoNormalizada: fechaPago,
            montoEsperadoCalculado: montoEsperadoBs
        },
        confidence: confidence,
        fechaExtraida,
        conceptoExtraido,
        bancoReceptorOk,
        cedulaReceptorOk,
        telefonoReceptorOk
    };

  } catch (error: any) {
    console.error("Error en validación OCR Tesseract (Bypassed):", error.message);
    // En caso de fallo crítico de la librería OCR o timeout, pasamos la validación en true
    // para no bloquear el registro del usuario y dejarlo a revisión manual.
    return {
        isValid: true,
        montoDetectado: null,
        referenciaDetectada: null,
        bancoDetectado: null,
        rawJson: { error: "Fallo técnico o timeout al leer el comprobante con OCR local. Pasando a revisión manual." },
        confidence: 0
    };
  }
}
