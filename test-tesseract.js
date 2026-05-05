const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');

async function testOCR(imagePath, montoEsperado) {
    console.log('====================================================');
    console.log(`[TEST] INICIANDO TESSERACT OCR EN: ${imagePath}`);
    console.log(`[TEST] MONTO ESPERADO: ${montoEsperado} Bs`);
    console.log('====================================================');

    try {
        const buffer = fs.readFileSync(path.resolve(imagePath));
        
        console.log('[1] Ejecutando reconocimiento óptico (spa+eng)...');
        const { data: { text } } = await Tesseract.recognize(
            buffer,
            'spa+eng',
            { logger: m => console.log(`[Tesseract] ${m.status} - ${(m.progress * 100).toFixed(0)}%`) }
        );

        console.log('\n[2] Texto en bruto extraído:\n----------------------------------------');
        console.log(text);
        console.log('----------------------------------------\n');

        const regex = /(?:\b|Bs\.?\s*|Monto:\s*)([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)\b/gi;
        const matches = [...text.matchAll(regex)];
        const candidatos = [];

        for (const match of matches) {
            let numStr = match[1];
            const parts = numStr.split(/[.,]/);
            if (parts.length > 1) {
                const lastPart = parts[parts.length - 1];
                if (lastPart.length <= 2) {
                    const intPart = parts.slice(0, -1).join('');
                    numStr = intPart + '.' + lastPart;
                } else {
                    numStr = parts.join('');
                }
            }

            const parsed = parseFloat(numStr);
            if (!isNaN(parsed) && parsed > 1 && parsed < 500000) {
                candidatos.push(parsed);
            }
        }

        console.log('[3] Números candidatos filtrados (>1, <500k):', candidatos);

        if (candidatos.length === 0) {
            console.log('\n[-] FALLO: No se encontraron candidatos monetarios válidos.');
            return;
        }

        const margen = 5.0;
        const candidatoIdeal = candidatos.find(c => c >= montoEsperado - margen && c <= montoEsperado + margen);
        
        console.log('\n====================================================');
        if (candidatoIdeal !== undefined) {
            console.log(`[+] ¡ÉXITO! Se encontró el monto exacto: ${candidatoIdeal} Bs`);
        } else {
            const montoMaximo = Math.max(...candidatos);
            console.log(`[!] No se encontró coincidencia exacta con el monto esperado.`);
            console.log(`[+] Fallback: Tomando el monto máximo encontrado: ${montoMaximo} Bs`);
        }
        console.log('====================================================');

    } catch (e) {
        console.error('Error durante la prueba OCR:', e);
    }
}

// INSTRUCCIONES DE USO:
// Reemplaza 'tu_comprobante.jpg' con la ruta de una imagen de pago móvil.
// Reemplaza '489.55' con el monto que deberías estar buscando (dependiendo de la tasa).
const imageToTest = process.argv[2] || 'test_comprobante.jpg';
const montoEsperadoTest = parseFloat(process.argv[3]) || 489.55;

if (!fs.existsSync(imageToTest)) {
    console.log(`Por favor, coloca una imagen llamada "${imageToTest}" en esta carpeta,`);
    console.log(`o ejecuta el script pasando los argumentos: node test-tesseract.js <ruta_imagen> <monto_esperado>`);
} else {
    testOCR(imageToTest, montoEsperadoTest);
}
