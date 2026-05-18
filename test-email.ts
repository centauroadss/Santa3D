import { sendEmailConfirmacion } from './lib/copa2026/emails/email1-confirmacion';

async function main() {
  try {
    console.log("Sending email...");
    await sendEmailConfirmacion({
      nombre: 'Raul Test',
      email: 'joaou@example.com', // Fake or safe email
      categoria: 'IA',
      montoBs: 100,
      telefonoPago: '04141234567',
      tokenVideo: 'test-token-123'
    });
    console.log("Email sent!");
  } catch (e) {
    console.error(e);
  }
}

main();
