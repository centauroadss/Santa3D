require('dotenv').config(); // Cargar .env puro
const { Resend } = require('resend');
console.log('--- INICIO DIAGNÓSTICO ---');
console.log('1. Verificando Variables de Entorno...');
const key = process.env.RESEND_API_KEY;
if (!key) {
    console.error('❌ ERROR CRÍTICO: RESEND_API_KEY no existe o está vacía en process.env');
    console.log('Contenido leído de .env:', require('fs').readFileSync('.env', 'utf8').substring(0, 50) + '...');
} else {
    console.log('✅ RESEND_API_KEY encontrada:', key.substring(0, 5) + '...');
    
    // Prueba de envío real
    console.log('2. Intentando envío de prueba directo a Resend...');
    const resend = new Resend(key);
    
    resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'joaoucab@gmail.com', 
      subject: 'Diagnostico Servidor Santa 3D',
      html: '<p>Si lees esto, la clave y la red funcionan correctamente.</p>'
    }).then(data => {
        console.log('✅ RESPUESTA DE RESEND (Éxito):', data);
    }).catch(err => {
        console.error('❌ ERROR DE ENVÍO RESEND:', err);
    });
}
console.log('--- FIN DIAGNÓSTICO ---');
