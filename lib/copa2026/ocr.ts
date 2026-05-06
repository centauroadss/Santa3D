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
  referenciaEsperada: string,
  nombre: string,
  apellido: string,
  cedula: string
): Promise<OcrResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Falta ANTHROPIC_API_KEY. No se puede validar el comprobante.");
    return {
      isValid: false,
      montoDetectado: null,
      referenciaDetectada: null,
      bancoDetectado: null,
      rawJson: { error: "El sistema OCR no está configurado (Falta ANTHROPIC_API_KEY)." },
      confidence: 0
    };
  }

  try {
    // Limpiar header base64 si existe
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const mimeType = base64Image.includes('pdf') ? 'application/pdf' : 'image/jpeg';
    
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
INSTRUCCIÓN CRÍTICA: NO calcules ni infieras montos. Debes extraer exactamente el número que aparece como el monto transferido en el comprobante.
Devuelve EXACTAMENTE un objeto JSON válido sin texto adicional (ni markdown) con esta estructura:
{
  "monto": 123.45,
  "referencia": "últimos 6 digitos numéricos",
  "banco": "Nombre del banco",
  "fecha": "YYYY-MM-DD",
  "concepto": "Texto literal que aparece en concepto o descripción u observación"
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
    const conceptoDetectado = (parsed.concepto || "").toLowerCase();
    
    // Validar lógicamente
    const isMontoValid = montoDetectado !== null && montoDetectado !== undefined && Math.abs(montoDetectado - montoEsperado) < 1.0; // Tolerancia 1 Bs para redondeos
    
    if (!isMontoValid) {
      return {
        isValid: false,
        montoDetectado,
        referenciaDetectada,
        bancoDetectado: parsed.banco,
        rawJson: { ...parsed, error: `Monto incorrecto. Detectado: ${montoDetectado}, Esperado: ${montoEsperado}` },
        confidence: 0.95
      };
    }

    // Validar concepto
    const nombreParts = nombre.toLowerCase().split(' ');
    const apellidoParts = apellido.toLowerCase().split(' ');
    const cedulaRaw = cedula.replace(/[^0-9]/g, '');

    const hasNameMatch = nombreParts.some(p => p.length > 2 && conceptoDetectado.includes(p)) || 
                         apellidoParts.some(p => p.length > 2 && conceptoDetectado.includes(p));
    const hasCedulaMatch = conceptoDetectado.includes(cedulaRaw);

    if (!hasNameMatch && !hasCedulaMatch) {
       return {
        isValid: false,
        montoDetectado,
        referenciaDetectada,
        bancoDetectado: parsed.banco,
        rawJson: { ...parsed, error: `El concepto del pago no incluye el nombre ni la cédula del participante. Concepto detectado: "${conceptoDetectado}"` },
        confidence: 0.95
      };
    }

    return {
      isValid: true,
      montoDetectado,
      referenciaDetectada,
      bancoDetectado: parsed.banco,
      rawJson: parsed,
      confidence: 0.95
    };

  } catch (error) {
    console.error("Error en validación OCR:", error);
    throw new Error("No se pudo procesar la validación del comprobante. Intenta subir una imagen más clara.");
  }
}
