const fs = require('fs');

async function test() {
  const formData = new FormData();
  formData.append('nombre', 'Test');
  formData.append('apellido', 'User');
  formData.append('cedulaIdentidad', 'V-12345678');
  formData.append('email', 'test@example.com');
  formData.append('telefono', '04141234567');
  formData.append('instagram', '@testuser');
  formData.append('fechaNacimiento', '1990-01-01');
  formData.append('categoria', 'RENDER');
  formData.append('biografia', 'Test bio con más de cincuenta caracteres para que sea validada correctamente por el backend.');
  formData.append('aceptaTerminos', 'true');
  formData.append('cesionDerechos', 'true');
  formData.append('confirmaMayoriaEdad', 'true');
  formData.append('bancoOrigen', 'BANESCO');
  formData.append('cedulaPago', 'V-12345678');
  formData.append('telefonoPago', '04141234567');
  formData.append('referencia', '123456789012');
  formData.append('concepto', 'Test User V-12345678');
  formData.append('fechaPago', new Date().toISOString());

  // Dummy image (1x1 transparent PNG)
  const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('comprobanteFile', blob, 'comprobante.png');
  formData.append('fotoPerfilFile', blob, 'foto.png');

  console.log('Sending request to API...');
  const res = await fetch('https://santa3d.centauroads.com/api/copa2026/inscripcion', {
    method: 'POST',
    body: formData,
  });

  console.log(`Status: ${res.status}`);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log('JSON Response:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('Text Response:', text.substring(0, 500));
  }
}

test();
