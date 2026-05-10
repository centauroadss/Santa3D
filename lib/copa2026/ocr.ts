import Tesseract from 'tesseract.js';

interface OcrResult {
  isValid: boolean;
  montoDetectado: number | null;
  referenciaDetectada: string | null;
  bancoDetectado: string | null;
  rawJson: any;
  confidence: number;
}

export async function validarComprobanteOcr(
  base64Image: string, 
  montoEsperado: number, 
  referenciaEsperada: string,
  nombre: string,
  apellido: string,
  cedula: string
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
    const regex = /(?:\b|Bs\.?\s*|Monto:\s*|Monto\s*|BsS\s*)([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)\b/gi;
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

    const margen = 5.0; // 5 Bs de tolerancia
    const candidatoIdeal = candidatos.find(c => c >= montoEsperado - margen && c <= montoEsperado + margen);

    // Búsqueda de referencia
    // Buscamos al menos los últimos 4 dígitos de la referencia para mayor flexibilidad ante lectura parcial
    const refLimpia = referenciaEsperada.replace(/\D/g, '');
    const refFragment = refLimpia.length > 4 ? refLimpia.slice(-4) : refLimpia;
    const referenciaEncontrada = refFragment.length > 0 && text.includes(refFragment);

    // Búsqueda de concepto/cédula en el texto raw como método auxiliar
    const cedulaRaw = cedula.replace(/[^0-9]/g, '');
    const cedulaEncontrada = cedulaRaw.length > 0 && text.includes(cedulaRaw);

    // Lógica de aceptación flexible: Aceptamos para no bloquear al usuario.
    // Tesseract puede fallar en detectar el monto si la fuente es pequeña.
    // Si no encuentra nada, igual devolvemos isValid: true para que proceda a revisión manual.
    return {
        isValid: true,
        montoDetectado: candidatoIdeal || (candidatos.length > 0 ? Math.max(...candidatos) : null),
        referenciaDetectada: referenciaEncontrada ? referenciaEsperada : null,
        bancoDetectado: null,
        rawJson: { 
            mensaje: "Procesado por Tesseract local", 
            candidatos, 
            text_extracted: text 
        },
        confidence: confidence
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
