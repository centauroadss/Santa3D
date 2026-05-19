import fs from 'fs';

async function testRegistration() {
  const formData = new FormData();
  
  // Basic info
  formData.append('nombre', 'Raul');
  formData.append('apellido', 'Dhoy');
  const randCI = '11599' + Math.floor(Math.random() * 999);
  formData.append('cedulaIdentidad', `V-${randCI}`);
  formData.append('email', `raul.dhoy.${randCI}@test.com`);
  formData.append('telefono', '04241355408');
  formData.append('instagram', 'rauldhoy');
  formData.append('fechaNacimiento', '1990-01-01');
  formData.append('categoria', 'RENDER');
  formData.append('biografia', 'Hola soy Raul Dhoy. Me gusta el 3D.');
  formData.append('aceptaTerminos', 'true');
  formData.append('cesionDerechos', 'true');
  formData.append('confirmaMayoriaEdad', 'true');
  
  // Payment info
  formData.append('bancoOrigen', '0134');
  formData.append('cedulaPago', 'V-11599999'); 
  formData.append('telefonoPago', '04241355408');
  formData.append('referencia', '061263180373'); 
  formData.append('concepto', 'raul dhoy 11599999'); 
  
  // Files
  const comprobanteBuffer = fs.readFileSync('C:\\Users\\joaou\\.gemini\\antigravity\\brain\\6fc34806-7abc-4b61-8f73-2d2c1d7f6e42\\media__1779153244421.jpg');
  const comprobanteBlob = new Blob([comprobanteBuffer], { type: 'image/jpeg' });
  formData.append('comprobanteFile', comprobanteBlob, 'recibo.jpg');
  
  formData.append('fotoPerfilFile', comprobanteBlob, 'foto.jpg');
  
  console.log("Enviando POST a http://167.172.217.151/api/copa2026/inscripcion...");
  
  try {
    const res = await fetch('http://167.172.217.151/api/copa2026/inscripcion', {
      method: 'POST',
      body: formData,
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error conectando:", err.message);
  }
}

testRegistration().catch(console.error);
