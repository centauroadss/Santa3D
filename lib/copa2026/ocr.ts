import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Llama a Claude Vision para extraer el monto total en bolívares de un comprobante de pago.
 * @param base64Image Imagen en formato base64 (sin el prefijo data:image/jpeg;base64,)
 * @param mediaType Tipo MIME de la imagen (e.g., 'image/jpeg', 'image/png')
 * @returns El monto extraído como número, o lanza un error si no se pudo determinar.
 */
export async function extractMontoFromCapture(base64Image: string, mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"): Promise<number> {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY no está configurada.');
    }

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            temperature: 0,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64Image,
                            },
                        },
                        {
                            type: 'text',
                            text: 'Extrae únicamente el monto total en bolívares de este comprobante de pago móvil venezolano. Responde solo con el número usando punto como separador decimal si aplica (ejemplo: 150.50). No incluyas símbolos de moneda, letras, ni separadores de miles. Si la imagen no es un comprobante legible o no se ve el monto, responde exactamente la palabra "ERROR".',
                        }
                    ],
                }
            ],
        });

        const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : 'ERROR';
        
        if (rawText === 'ERROR') {
            throw new Error('La imagen no es un comprobante legible o no se pudo extraer el monto.');
        }

        // Convertir texto a número de forma segura (e.g. "1.500,50" -> 1500.50 si el modelo se equivocó en el formato)
        const normalizedText = rawText.replace(/[^0-9,\.]/g, '').replace(',', '.');
        const lastDotIndex = normalizedText.lastIndexOf('.');
        let cleanNumberStr = normalizedText;
        if (lastDotIndex !== -1) {
             const withoutLastDot = normalizedText.replace(/\./g, '');
             const adjustedDotIndex = lastDotIndex - (normalizedText.length - withoutLastDot.length) + 1;
             cleanNumberStr = withoutLastDot.slice(0, adjustedDotIndex) + '.' + withoutLastDot.slice(adjustedDotIndex);
        }

        const monto = parseFloat(cleanNumberStr);

        if (isNaN(monto)) {
            throw new Error('No se pudo convertir el valor extraído a número: ' + rawText);
        }

        return monto;
    } catch (error) {
        console.error('Error en OCR de Anthropic:', error);
        throw error;
    }
}
