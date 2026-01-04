require('dotenv').config();
const nodemailer = require('nodemailer');
async function main() {
  console.log('\n--- DIAGNÓSTICO DE CORREO ---');
  console.log('Usuario:', process.env.SMTP_USER);
  console.log('Proveedor:', process.env.EMAIL_PROVIDER);
  // Configuración Exacta usada en la App
  const config = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
      },
  };
  console.log('Conectando a Gmail (Puerto 465)...');
  const transporter = nodemailer.createTransport(config);
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Se envía a sí mismo
      subject: "PRUEBA TECNICA SANTA 3D",
      text: "Si recibes esto, el servidor tiene permiso para enviar correos correctamente.",
    });
    console.log("✅ ¡ÉXITO! Correo enviado.");
    console.log("ID Mensaje:", info.messageId);
    console.log("Revisa tu bandeja de entrada de:", process.env.SMTP_USER);
  } catch (err) {
    console.error("\n❌ ERROR CRÍTICO:");
    console.error(err);
  }
}
main();
