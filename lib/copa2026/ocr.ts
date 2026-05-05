import Tesseract from 'tesseract.js';

/**
 * Llama a Tesseract.js (motor OCR local y open-source) para extraer el monto en bolívares de un comprobante de pago.
 * Utiliza heurística y expresiones regulares para aislar el monto, priorizando aquel que coincida con el esperado.
 * 
 * @param base64Image Imagen en formato base64 (sin el prefijo data:image/jpeg;base64,)
 * @param mediaType Tipo MIME de la imagen (e.g., 'image/jpeg', 'image/png')
 * @param montoEsperado El monto calculado que deberíamos encontrar (con cierta tolerancia)
 * @returns El monto extraído como número, o lanza un error si no se pudo determinar.
 */
export async function extractMontoFromCapture(
    base64Image: string, 
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
    montoEsperado?: number
): Promise<number> {
    try {
        const buffer = Buffer.from(base64Image, 'base64');
        
        // 1. Extraer texto crudo de la imagen usando Tesseract
        // Se carga el paquete en inglés y español para mejorar el reconocimiento de números y "Bs"
        const { data: { text } } = await Tesseract.recognize(
            buffer,
            'spa+eng',
            { logger: m => console.log(`[Tesseract OCR] ${m.status} - ${(m.progress * 100).toFixed(2)}%`) }
        );

        console.log('[Tesseract OCR] Texto en bruto extraído:\n', text);

        // 2. Extraer todos los números que tengan pinta de moneda (ej: 1.500,00 | 1,500.00 | 1500)
        // La RegEx busca números que puedan tener separadores de miles y decimales
        const regex = /(?:\b|Bs\.?\s*|Monto:\s*)([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)\b/gi;
        const matches = [...text.matchAll(regex)];
        const candidatos: number[] = [];

        for (const match of matches) {
            let numStr = match[1];

            // Normalización del número
            // Si el número tiene tanto punto como coma, o múltiples de uno de ellos
            const parts = numStr.split(/[.,]/);
            if (parts.length > 1) {
                const lastPart = parts[parts.length - 1];
                if (lastPart.length <= 2) {
                    // El último delimitador es decimal
                    const intPart = parts.slice(0, -1).join('');
                    numStr = intPart + '.' + lastPart;
                } else {
                    // No tiene decimales, todo es entero (ej: 1.500)
                    numStr = parts.join('');
                }
            }

            const parsed = parseFloat(numStr);
            // Filtros heurísticos: un pago móvil no suele ser mayor a 1,000,000 Bs (por límites del banco)
            // Ni suele ser menor a 1 Bs. Tampoco queremos números de teléfono (que se traducen en millones grandes)
            if (!isNaN(parsed) && parsed > 1 && parsed < 500000) {
                candidatos.push(parsed);
            }
        }

        console.log('[Tesseract OCR] Números candidatos extraídos:', candidatos);

        if (candidatos.length === 0) {
            throw new Error('La imagen no es un comprobante legible o no se pudo aislar un monto.');
        }

        // 3. Evaluar el mejor candidato si tenemos un montoEsperado
        if (montoEsperado && montoEsperado > 0) {
            // Buscamos un número que esté en un rango de ± 5.00 Bs del esperado
            const margen = 5.0;
            const candidatoIdeal = candidatos.find(c => c >= montoEsperado - margen && c <= montoEsperado + margen);
            
            if (candidatoIdeal !== undefined) {
                console.log(`[Tesseract OCR] ¡Monto ideal encontrado!: ${candidatoIdeal}`);
                return candidatoIdeal;
            }
        }

        // Si no tenemos un monto esperado, o no se encontró coincidencia exacta, 
        // devolvemos el número máximo encontrado (usualmente el TOTAL del pago es el más grande del recibo)
        // Ignorando números gigantes (teléfonos, referencias) que ya filtramos arriba.
        const montoMaximo = Math.max(...candidatos);
        console.log(`[Tesseract OCR] Retornando el mayor candidato válido: ${montoMaximo}`);
        return montoMaximo;

    } catch (error) {
        console.error('Error en OCR de Tesseract.js:', error);
        throw error;
    }
}
