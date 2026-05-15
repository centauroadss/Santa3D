const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  const form = new FormData();
  form.append('nombre', 'Test');
  form.append('apellido', 'User');
  form.append('cedulaIdentidad', '12345678');
  form.append('email', 'test@test.com');
  form.append('telefono', '04141234567');
  form.append('instagram', '@test');
  form.append('categoria', 'RENDER');
  form.append('telefonoPago', '04141234567');
  form.append('cedulaPago', '12345678');
  form.append('bancoOrigen', '0102');
  form.append('referencia', '123456');

  // Create a dummy image
  const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  
  form.append('fotoPerfilFile', dummyImage, { filename: 'perfil.png', contentType: 'image/png' });
  form.append('comprobanteFile', dummyImage, { filename: 'pago.png', contentType: 'image/png' });

  try {
    const res = await fetch('https://copa2026.centauroads.com/api/copa2026/inscripcion', {
      method: 'POST',
      body: form
    });
    
    const data = await res.json();
    console.log('Response:', res.status, data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testUpload();
