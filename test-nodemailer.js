const nodemailer = require('nodemailer');

async function main() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'centauroadss@gmail.com',
      pass: 'fkli oxwf iiwd kivj'
    }
  });

  try {
    const info = await transporter.sendMail({
      from: 'Concurso Santa 3D <centauroadss@gmail.com>',
      to: 'joaou@centauroads.com', // fake/test
      bcc: 'mercadeo@centauroads.com',
      subject: 'Test Email from Local',
      html: '<p>Test email</p>'
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
