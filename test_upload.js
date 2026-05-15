const fs = require('fs');

async function upload() {
  const url = "https://copa2026.centauroads.com/api/copa2026/inscripcion";
  
  const formData = new FormData();
  formData.append('nombre', 'Test');
  formData.append('apellido', 'Usuario');
  formData.append('cedulaIdentidad', `V-${Math.floor(Math.random() * 10000000)}`);
  formData.append('email', `test${Date.now()}@example.com`);
  formData.append('telefono', '04141234567');
  formData.append('instagram', `@test${Date.now()}`);
  formData.append('fechaNacimiento', '1990-01-01');
  formData.append('categoria', 'RENDER');
  formData.append('telefonoPago', '04141234567');
  formData.append('cedulaPago', 'V-9999999');
  formData.append('bancoOrigen', '0105');
  formData.append('referencia', Math.floor(Math.random() * 1000000).toString());
  
  const blob1 = new Blob(["fake image data"], { type: "image/jpeg" });
  formData.append('fotoPerfilFile', blob1, "foto.jpg");
  
  const blob2 = new Blob(["fake receipt data"], { type: "image/png" });
  formData.append('comprobanteFile', blob2, "comprobante.png");

  console.log("Enviando petición a:", url);
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });
  
  const text = await response.text();
  console.log("Status Code:", response.status);
  console.log("Response:", text);
}

upload();
