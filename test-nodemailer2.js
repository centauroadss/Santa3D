const nodemailer = require('nodemailer');

async function main() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'centauroadss@gmail.com',
      pass: 'fkli oxwf iiwd kivj'
    },
    logger: true,
    debug: true
  });

  try {
    console.log("Sending email...");
    const info = await transporter.sendMail({
      from: 'Concurso Santa 3D <centauroadss@gmail.com>',
      to: 'joaou@centauroads.com', // fake
      bcc: 'mercadeo@centauroads.com',
      subject: 'Test Email with Debug',
      html: '<p>Debug Test</p>'
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
