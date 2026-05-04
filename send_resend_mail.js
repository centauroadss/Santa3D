async function sendMail() {
  console.log("Intentando enviar correo usando fetch nativo...");
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_atbYuibo_8BkDuDN5rVgKZMeGbLLUCMk1',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'mercadeo@centauroads.com',
        to: ['michaelnelo66@gmail.com'],
        cc: ['mercadeo@centauroads.com'],
        subject: 'Prueba de integración - Resend',
        html: '<h2>Hola Michael</h2><p>Este es un correo de prueba enviado automáticamente usando la API de Resend sin dependencias adicionales.</p>'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error al enviar el correo:", data);
      return;
    }

    console.log("¡Correo enviado exitosamente!");
    console.log("Detalles:", data);
  } catch (error) {
    console.error("Excepción inesperada:", error);
  }
}

sendMail();
