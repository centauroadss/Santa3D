import assert from 'assert';

// Mock de la función extractora principal para no depender de Tesseract ni red real durante la prueba unitaria pura
// Extraemos la lógica que usamos en ocr.ts
function simularValidacionMonto(textoOCR: string, montoEsperado: number) {
    const amountRegex = /\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/g;
    const rawMatches = textoOCR.match(amountRegex);
    let candidatos: number[] = [];

    if (rawMatches) {
        candidatos = rawMatches.map(valStr => {
            const cleanStr = valStr.replace(/\./g, '').replace(',', '.');
            return parseFloat(cleanStr);
        }).filter(n => !isNaN(n));
    }

    const margen = 5.0; // 5 Bs de tolerancia
    // Filtramos los que sean mayores o iguales y tomamos el más cercano (menor)
    const candidatoIdeal = candidatos.filter(c => c >= montoEsperado - margen).sort((a, b) => a - b)[0];

    return {
        isValid: candidatoIdeal !== undefined,
        montoDetectado: candidatoIdeal || null
    };
}

async function runTests() {
    console.log("=== INICIANDO PRUEBAS UNITARIAS DE VALIDACIÓN DE MONTO ===");
    
    const tasaBcv = 508.60;
    const costoUsd = 10;
    const montoEsperadoBs = tasaBcv * costoUsd; // 5086.00
    
    console.log(`Monto Esperado (Tasa BCV ${tasaBcv} * ${costoUsd} USD) = ${montoEsperadoBs} Bs\n`);

    // Prueba 1: Monto Menor (Debe fallar)
    try {
        const ocrMenor = `Se recibió un pago de 4000,00 Bs. Ref 12345`;
        const resMenor = simularValidacionMonto(ocrMenor, montoEsperadoBs);
        assert.strictEqual(resMenor.isValid, false, "El monto menor no debería ser válido");
        console.log("✅ Prueba 1 (Monto Menor): Pasó correctamente (fue rechazado).");
    } catch (e: any) {
        console.error("❌ Prueba 1 falló:", e.message);
    }

    // Prueba 2: Monto Exactamente Igual (Debe pasar)
    try {
        const ocrIgual = `Se recibió un pago de 5.086,00 Bs por concepto de inscripción.`;
        const resIgual = simularValidacionMonto(ocrIgual, montoEsperadoBs);
        assert.strictEqual(resIgual.isValid, true, "El monto igual debería ser válido");
        assert.strictEqual(resIgual.montoDetectado, 5086.00, "Debe detectar el monto exacto");
        console.log("✅ Prueba 2 (Monto Igual): Pasó correctamente (fue aprobado).");
    } catch (e: any) {
        console.error("❌ Prueba 2 falló:", e.message);
    }

    // Prueba 3: Monto Mayor (Debe pasar)
    try {
        // Usuario pagó 5100 Bs, tal vez por redondeo manual o banco
        const ocrMayor = `Transferencia exitosa por 5.100,00 Bs. Ref 98765`;
        const resMayor = simularValidacionMonto(ocrMayor, montoEsperadoBs);
        assert.strictEqual(resMayor.isValid, true, "El monto mayor debería ser válido");
        assert.strictEqual(resMayor.montoDetectado, 5100.00, "Debe detectar el monto mayor pagado");
        console.log("✅ Prueba 3 (Monto Mayor): Pasó correctamente (fue aprobado).");
    } catch (e: any) {
        console.error("❌ Prueba 3 falló:", e.message);
    }

    // Prueba 4: Monto con Céntimos y Tolerancia (Dentro de los 5 Bs de margen hacia abajo)
    try {
        // Monto esperado es 5086.00, usuario pagó 5082.00 (dentro del margen de 5 Bs de tolerancia)
        const ocrMargen = `Pago recibido de 5.082,00 Bs`;
        const resMargen = simularValidacionMonto(ocrMargen, montoEsperadoBs);
        assert.strictEqual(resMargen.isValid, true, "El monto dentro del margen de tolerancia debería ser válido");
        console.log("✅ Prueba 4 (Margen de Tolerancia Menor): Pasó correctamente (fue aprobado).");
    } catch (e: any) {
        console.error("❌ Prueba 4 falló:", e.message);
    }

    console.log("\n=== PRUEBAS FINALIZADAS ===");
}

runTests();
