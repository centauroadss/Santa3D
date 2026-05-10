const FormData = require('form-data');

async function testOCR() {
    console.log("Creando payload para /api/copa2026/inscripcion...");
    
    // Create a 1x1 pixel JPEG base64
    const tinyJpegBase64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    const buffer = Buffer.from(tinyJpegBase64, 'base64');
    
    const form = new FormData();
    form.append('nombre', 'Usuario Prueba');
    form.append('apellido', 'OCR Local');
    form.append('cedulaIdentidad', 'V-12345678');
    form.append('email', 'test_ocr@centauroads.com');
    form.append('telefono', '+584141234567');
    form.append('categoria', 'RENDER');
    form.append('telefonoPago', '+584141234567');
    form.append('cedulaPago', 'V-12345678');
    form.append('bancoOrigen', '0102');
    form.append('referencia', '123456');
    
    form.append('fotoPerfilFile', buffer, { filename: 'foto.jpg', contentType: 'image/jpeg' });
    form.append('comprobanteFile', buffer, { filename: 'comprobante.jpg', contentType: 'image/jpeg' });

    console.log("Enviando petición a producción...");
    
    try {
        const res = await fetch("https://copa2026.centauroads.com/api/copa2026/inscripcion", {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });
        
        const data = await res.json();
        console.log("Respuesta del servidor:");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error al hacer fetch:", e);
    }
}

testOCR();
