import { PrismaClient } from '@prisma/client';

/**
 * Función que simula el motor de OCR y cruza la fecha extraída con la base de datos
 * para obtener la tasa de cambio vigente exacta para ese día.
 */
async function validarPagoHistorico(textoOcr: string, costoUsd: number) {
    // 1. Extraer la Fecha del OCR
    let fechaExtraida: string | null = null;
    const dateRegex = /\b(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/](\d{4}|\d{2})\b/g;
    const dateMatch = textoOcr.match(dateRegex);
    if (dateMatch && dateMatch.length > 0) {
        fechaExtraida = dateMatch[0];
    }

    let fechaPago = new Date();
    if (fechaExtraida) {
        const parts = fechaExtraida.split(/[-/]/);
        if (parts.length === 3) {
            let [day, month, year] = parts;
            if (year.length === 2) year = `20${year}`;
            fechaPago = new Date(`${year}-${month}-${day}T00:00:00Z`);
        }
    } else {
        fechaPago.setUTCHours(0,0,0,0);
    }

    // 2. BUSCAR LA TASA DE CAMBIO PARA ESA FECHA ESPECÍFICA (MOCK BD)
    // Simula la base de datos con las fechas de valor reales.
    // Ej: La tasa publicada el 12 a las 8 PM tiene fechaValor del 13.
    const tasasMockDb = [
        { fechaValor: new Date('2026-05-13T00:00:00Z'), tasaUsdBs: 508.60 }, // Aplica el 13
        { fechaValor: new Date('2026-05-12T00:00:00Z'), tasaUsdBs: 504.00 }, // Aplica el 12
        { fechaValor: new Date('2026-05-11T00:00:00Z'), tasaUsdBs: 500.00 }, // Aplica el 11
    ];
    
    // Obtiene la tasa oficial de la base de datos cuya fecha_valor sea <= a la fecha del recibo
    // (Aplica la tasa que estaba vigente en ese momento)
    const bcvRecord = tasasMockDb.find(t => t.fechaValor <= fechaPago);

    if (!bcvRecord) throw new Error("No se encontró tasa para esta fecha");

    const tasaBcv = bcvRecord.tasaUsdBs;
    const montoEsperadoBs = tasaBcv * costoUsd;

    // 3. EXTRAER MONTOS DEL TEXTO OCR
    const amountRegex = /\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/g;
    const rawMatches = textoOcr.match(amountRegex);
    let candidatos: number[] = [];

    if (rawMatches) {
        candidatos = rawMatches.map(valStr => {
            const cleanStr = valStr.replace(/\./g, '').replace(',', '.');
            return parseFloat(cleanStr);
        }).filter(n => !isNaN(n));
    }

    // 4. VALIDACIÓN DE MONTO (Menor, Igual o Mayor)
    const margen = 5.0; // 5 Bs de tolerancia bancaria por redondeo
    
    // Filtramos montos que sean iguales o mayores al esperado en esa fecha exacta
    const candidatoIdeal = candidatos
        .filter(c => c >= montoEsperadoBs - margen)
        .sort((a, b) => a - b)[0];

    return {
        isValid: candidatoIdeal !== undefined,
        fechaReciboExtraida: fechaExtraida,
        montoEsperado: montoEsperadoBs,
        montoDetectado: candidatoIdeal || (candidatos.length > 0 ? Math.max(...candidatos) : null),
        tasaUsada: tasaBcv,
        fechaTasaBCV: bcvRecord.fechaValor.toISOString().split('T')[0]
    };
}

// ============================================================================
// EJECUCIÓN DE PRUEBAS
// ============================================================================
async function ejecutarPruebas() {
    console.log("===============================================================");
    console.log("⚙️  PRUEBAS DE INTEGRACIÓN: EXTRACCIÓN DE FECHA Y CRUCE DE TASA BCV");
    console.log("===============================================================\n");

    const COSTO_USD = 10;

    try {
        console.log("=> Base de datos simulada contiene tasas validas para: 11, 12 y 13 de Mayo.");
        console.log("=> Costo Base: 10 USD\n");

        // --------------------------------------------------------------------
        // PRUEBA 1: PAGO EL DÍA 12 (DEBE APLICAR TASA DEL 12: 504.00)
        // --------------------------------------------------------------------
        console.log("▶ PRUEBA 1: Recibo del 12/05/2026. Esperamos Tasa de 504 Bs (Monto Mínimo 5040 Bs)");
        const txtPago12 = "Recibo Banesco por transferencia de 5.040,00 Bs. Fecha: 12/05/2026";
        const res12 = await validarPagoHistorico(txtPago12, COSTO_USD);
        
        console.log(`   - Fecha Extraída del OCR: ${res12.fechaReciboExtraida}`);
        console.log(`   - Tasa BCV Seleccionada: ${res12.tasaUsada} (Fecha Valor: ${res12.fechaTasaBCV})`);
        console.log(`   - Monto Mínimo Requerido: ${res12.montoEsperado} | Monto Detectado en Recibo: ${res12.montoDetectado}`);
        if (res12.isValid && res12.tasaUsada === 504) {
            console.log("   ✅ PASÓ: El OCR leyó la fecha correctamente y retrocedió a la tasa histórica correcta.\n");
        } else {
            console.error("   ❌ FALLÓ: El pago no usó la tasa correcta.\n");
        }

        // --------------------------------------------------------------------
        // PRUEBA 2: PAGO EL DÍA 13 (DEBE APLICAR LA NUEVA TASA: 508.60)
        // --------------------------------------------------------------------
        console.log("▶ PRUEBA 2: Recibo del 13/05/2026 intentando pagar con la tasa vieja de 5040 Bs.");
        const txtPago13 = "Transferencia de 5.040,00 Bs. Fecha: 13/05/2026";
        const res13 = await validarPagoHistorico(txtPago13, COSTO_USD);
        
        console.log(`   - Fecha Extraída del OCR: ${res13.fechaReciboExtraida}`);
        console.log(`   - Tasa BCV Seleccionada: ${res13.tasaUsada} (Fecha Valor: ${res13.fechaTasaBCV})`);
        console.log(`   - Monto Mínimo Requerido: ${res13.montoEsperado} | Monto Detectado en Recibo: ${res13.montoDetectado}`);
        if (!res13.isValid && res13.tasaUsada === 508.6) {
            console.log("   ✅ PASÓ: El OCR detectó la fecha 13, aplicó la nueva tasa (508.6) y RECHAZÓ el pago viejo.\n");
        } else {
            console.error("   ❌ FALLÓ: Sistema aceptó el pago o usó tasa incorrecta.\n");
        }

        // --------------------------------------------------------------------
        // PRUEBA 3: PAGO EL DÍA 13 DE FORMA CORRECTA
        // --------------------------------------------------------------------
        console.log("▶ PRUEBA 3: Recibo del 13/05/2026 con pago correcto o superior (Pagó 5086 Bs).");
        const txtPago13Ok = "Monto debitado: 5.086,00 Bs. Fecha de captura: 13/05/2026.";
        const res13Ok = await validarPagoHistorico(txtPago13Ok, COSTO_USD);
        
        console.log(`   - Fecha Extraída del OCR: ${res13Ok.fechaReciboExtraida}`);
        console.log(`   - Tasa BCV Seleccionada: ${res13Ok.tasaUsada} (Fecha Valor: ${res13Ok.fechaTasaBCV})`);
        console.log(`   - Monto Mínimo Requerido: ${res13Ok.montoEsperado} | Monto Detectado en Recibo: ${res13Ok.montoDetectado}`);
        if (res13Ok.isValid) {
            console.log("   ✅ PASÓ: El sistema APROBÓ el pago cruzando fecha con la tasa BCV correcta.\n");
        } else {
            console.error("   ❌ FALLÓ: Sistema rechazó el pago válido.\n");
        }

    } catch (e: any) {
        console.error("Error crítico durante las pruebas:", e);
    }
}

ejecutarPruebas();
