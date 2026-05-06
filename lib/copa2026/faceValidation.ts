import axios from 'axios';

interface FaceValidationResult {
  isValid: boolean;
  reason?: string;
}

export async function validateProfilePhoto(base64Image: string): Promise<FaceValidationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Falta ANTHROPIC_API_KEY, simulando éxito de validación de rostro...");
    return { isValid: true };
  }

  try {
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

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
                  media_type: "image/jpeg",
                  data: base64Data
                }
              },
              {
                type: "text",
                text: `Analiza esta imagen y determina si cumple EXACTAMENTE con las siguientes reglas:
1. Contiene el rostro de UNA SOLA persona humana de forma clara.
2. NO es un paisaje, animal, objeto inanimado, ilustración o dibujo.
3. NO hay más de una persona en la foto.

Responde ÚNICAMENTE con un objeto JSON válido con este formato, sin markdown ni texto extra:
{
  "isValid": true/false,
  "reason": "Explicación breve de por qué es válida o inválida (ej. 'Hay más de una persona en la foto', 'Es la foto de un perro', 'Es un rostro humano válido')"
}`
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
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(textResponse);

    return {
      isValid: parsed.isValid,
      reason: parsed.reason
    };

  } catch (error) {
    console.error("Error en validación de rostro (IA):", error);
    // En caso de fallo de API, es mejor permitir el paso a bloquear al usuario por un error técnico nuestro
    return { isValid: true, reason: "Error interno de validación ignorado" };
  }
}
