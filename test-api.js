const fs = require('fs');
const path = require('path');

async function test() {
  const formData = new FormData();
  formData.append('nombre', 'Raul');
  formData.append('apellido', 'Dhoy');
  formData.append('cedulaIdentidad', 'V-11599999');
  formData.append('email', 'raul.dhoy@example.com');
  formData.append('telefono', '04141234567');
  formData.append('instagram', '@rauldhoy');
  formData.append('fechaNacimiento', '1990-01-01');
  formData.append('categoria', 'IA');
  formData.append('biografia', 'Soy un creador de contenido con IA y me encanta la tecnología.');
  formData.append('aceptaTerminos', 'true');
  formData.append('cesionDerechos', 'true');
  formData.append('confirmaMayoriaEdad', 'true');
  
  // Dummy file blobs
  const dummyFoto = new Blob(['dummy'], { type: 'image/jpeg' });
  const dummyComp = new Blob(['dummy'], { type: 'image/jpeg' });
  
  formData.append('fotoPerfilFile', dummyFoto, 'foto.jpg');
  
  formData.append('bancoOrigen', '0134');
  formData.append('cedulaPago', 'V-11599999');
  formData.append('telefonoPago', '04141237262');
  formData.append('referencia', '061263180373');
  formData.append('concepto', 'raul dhoy 11599999');
  formData.append('comprobanteFile', dummyComp, 'comp.jpg');

  try {
    const res = await fetch('http://localhost:3000/api/copa2026/inscripcion', {
      method: 'POST',
      body: formData
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

test();
