const fs = require('fs');

async function run() {
  const form = new FormData();
  
  form.append('nombre', 'John');
  form.append('apellido', 'Doe');
  form.append('cedulaIdentidad', 'V-12345678');
  form.append('email', 'john@example.com');
  form.append('telefono', '+584141234567');
  form.append('instagram', '@johndoe');
  form.append('fechaNacimiento', '1990-01-01');
  form.append('categoria', 'RENDER');
  form.append('biografia', 'Soy un test');
  form.append('aceptaTerminos', 'true');
  form.append('cesionDerechos', 'true');
  form.append('confirmaMayoriaEdad', 'true');
  
  form.append('bancoOrigen', '0134');
  form.append('cedulaPago', 'V-12345678');
  form.append('telefonoPago', '+584141234567');
  form.append('referencia', '123456');
  // HERE WE INCLUDE THE CONCEPTO!
  form.append('concepto', 'John Doe V-12345678');
  
  // Dummy files
  fs.writeFileSync('dummy.jpg', 'fake image');
  const buffer = fs.readFileSync('dummy.jpg');
  form.append('comprobanteFile', new Blob([buffer], { type: 'image/jpeg' }), 'dummy.jpg');
  form.append('fotoPerfilFile', new Blob([buffer], { type: 'image/jpeg' }), 'dummy2.jpg');
  
  try {
    const res = await fetch('http://copa2026.centauroads.com/api/copa2026/inscripcion', {
      method: 'POST',
      body: form
    });
    
    const json = await res.json();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("HTTP ERROR:", err);
  }
}

run();
