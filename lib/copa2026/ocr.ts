import axios from 'axios';

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
  referenciaEsperada: string
): Promise<OcrResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Falta ANTHROPIC_API_KEY, simulando éxito en desarrollo...");
    return {
      isValid: true,
      montoDetectado: montoEsperado,
      referenciaDetectada: referenciaEsperada,
      bancoDetectado: "Bancamiga",
      rawJson: { mock: true },
      confidence: 1.0
    };
  }

  try {
    // Limpiar header base64 si existe
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const mimeType = base64Image.includes('pdf') ? 'application/pdf' : 'image/jpeg';
    
    // Si es PDF, Anthropic Claude 3.5 Sonnet soporta PDF via Base64, pero simplificaremos asumiendo imagen o PDF convertido a imagen.
    // Para asegurar compatibilidad con la API vision de Claude, usaremos image/jpeg.
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg',
                  data: base64Data
                }
              },
              {
                type: "text",
                text: `Extrae la información de este comprobante de pago móvil venezolano.
Devuelve EXACTAMENTE un objeto JSON válido sin texto adicional (ni markdown) con esta estructura:
{
  "monto": 123.45,
  "referencia": "últimos 6 digitos numéricos",
  "banco": "Nombre del banco",
  "fecha": "YYYY-MM-DD"
}
Si no encuentras un valor, pon null.`
              }
            ]
          }
        ]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    let textResponse = response.data.content[0].text;
    
    // Limpiar markdown json si existe
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(textResponse);

    const montoDetectado = parsed.monto;
    const referenciaDetectada = parsed.referencia;
    
    // Validar lógicamente
    const isMontoValid = montoDetectado && Math.abs(montoDetectado - montoEsperado) < 1.0; // Tolerancia 1 Bs
    const isRefValid = referenciaEsperada && referenciaDetectada && referenciaDetectada.endsWith(referenciaEsperada);
    
    // En este concurso el OCR da el "Check" si el monto coincide. 
    // La referencia es un plus pero exigiremos el monto.
    const isValid = !!isMontoValid;

    return {
      isValid,
      montoDetectado,
      referenciaDetectada,
      bancoDetectado: parsed.banco,
      rawJson: parsed,
      confidence: isValid ? 0.95 : 0.5
    };

  } catch (error) {
    console.error("Error en validación OCR:", error);
    throw new Error("No se pudo procesar la validación del comprobante. Intenta subir una imagen más clara.");
  }
}
