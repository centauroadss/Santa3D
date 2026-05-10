const fs = require('fs');

const jpegBase64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
const buffer = Buffer.from(jpegBase64, 'base64');

fs.writeFileSync('perfil.jpg', buffer);
fs.writeFileSync('comprobante.jpg', buffer);
console.log("Files created.");
