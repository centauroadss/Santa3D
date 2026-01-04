require('dotenv').config();
const { Resend } = require('resend');
async function main() {
  console.log('--- DIAGNÓSTICO RESEND ---');
  const key = process.env.RESEND_API_KEY;
  console.log('API Key:', key ? key.substring(0, 5) + '...' : 'NO ENCONTRADA');
  const resend = new Resend(key);
  // Intentar enviar a centauroadss@gmail.com
  console.log('\n1. Probando envío a: centauroadss@gmail.com');
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'centauroadss@gmail.com',
      subject: 'Test Resend 1',
      html: '<p>Prueba 1</p>'
    });
    if (data.error) throw data.error;
    console.log('✅ ÉXITO. ID:', data.data?.id);
  } catch (err) {
    console.log('❌ FALLÓ:', err.message || err);
  }
  // Intentar enviar a joaoucab@gmail.com
  console.log('\n2. Probando envío a: joaoucab@gmail.com');
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'joaoucab@gmail.com',
      subject: 'Test Resend 2',
      html: '<p>Prueba 2</p>'
    });
    if (data.error) throw data.error;
    console.log('✅ ÉXITO. ID:', data.data?.id);
  } catch (err) {
    console.log('❌ FALLÓ:', err.message || err);
  }
}
main();
