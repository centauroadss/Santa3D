import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('167.172.217.151', username='root', password='MERcenta2026!.ds')

script_js = """
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

async function testRegistration() {
  // 1. Limpiar usuario de prueba si existe
  const prisma = new PrismaClient();
  await prisma.inscripcionCopa2026.deleteMany({ where: { cedulaIdentidad: 'V-11599999' } });
  await prisma.pagoMovil.deleteMany({ where: { concepto: 'raul dhoy 11599999' } }); // just in case
  
  const formData = new FormData();
  
  formData.append('nombre', 'Raul');
  formData.append('apellido', 'Dhoy');
  formData.append('cedulaIdentidad', 'V-11599999');
  formData.append('email', 'raul.dhoy.test@test.com');
  formData.append('telefono', '04241355408');
  formData.append('instagram', '@rauldhoy');
  formData.append('fechaNacimiento', '1990-01-01');
  formData.append('categoria', 'RENDER');
  formData.append('biografia', 'Hola soy Raul Dhoy. Me gusta el 3D.');
  formData.append('aceptaTerminos', 'true');
  formData.append('cesionDerechos', 'true');
  formData.append('confirmaMayoriaEdad', 'true');
  
  formData.append('bancoOrigen', '0134');
  formData.append('cedulaPago', 'V-11599999'); 
  formData.append('telefonoPago', '04241355408');
  formData.append('referencia', '061263180373'); 
  formData.append('concepto', 'raul dhoy 11599999'); 
  
  const comprobanteBuffer = fs.readFileSync('/app/recibo.jpg');
  const comprobanteBlob = new Blob([comprobanteBuffer], { type: 'image/jpeg' });
  formData.append('comprobanteFile', comprobanteBlob, 'recibo.jpg');
  formData.append('fotoPerfilFile', comprobanteBlob, 'foto.jpg');
  
  console.log("Enviando POST a http://localhost:3000/api/copa2026/inscripcion...");
  
  try {
    const res = await fetch('http://localhost:3000/api/copa2026/inscripcion', {
      method: 'POST',
      body: formData,
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error conectando:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration().catch(console.error);
"""

sftp = client.open_sftp()
with sftp.file('/tmp/test-prod-reg.mjs', 'w') as f:
    f.write(script_js)
sftp.close()

client.exec_command('docker cp /tmp/test-prod-reg.mjs $(docker ps -q --filter "name=project_copa2026.1"):/app/test-prod-reg.mjs')

print("Ejecutando POST a traves del contenedor...")
stdin, stdout, stderr = client.exec_command('docker exec $(docker ps -q --filter "name=project_copa2026.1") npx tsx /app/test-prod-reg.mjs')

print("STDOUT:")
print(stdout.read().decode('utf-8'))
print("STDERR:")
print(stderr.read().decode('utf-8'))

client.close()
