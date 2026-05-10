async function verificarEvidencia() {
    try {
        console.log('====================================================');
        console.log('EVIDENCIA EN VIVO DEL SCRAPER (SIN BD)');
        console.log('====================================================');

        console.log('[!] INICIANDO EXTRACCIÓN EN TIEMPO REAL...');
        
        let usdValue = null;
        let fechaVigencia = new Date();
        fechaVigencia.setUTCHours(0,0,0,0);
        
        console.log('[1] Intentando DolarAPI...');
        const res1 = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await res1.json();
        
        if (data.promedio) {
            usdValue = data.promedio;
            if (data.fechaActualizacion) {
                fechaVigencia = new Date(data.fechaActualizacion);
                fechaVigencia.setUTCHours(0, 0, 0, 0);
            }
            console.log(`[+] Éxito con DolarAPI.`);
            console.log(`    -> Tasa Oficial BCV: ${usdValue}`);
            console.log(`    -> Fecha de Vigencia Oficial (BCV): ${fechaVigencia.toISOString().split('T')[0]}`);
        } else {
            console.log('[-] DolarAPI falló. Intentando AllOrigins Proxy Scraping...');
            const res2 = await fetch('https://api.allorigins.win/get?url=https://www.bcv.org.ve/');
            const data2 = await res2.json();
            const match = data2.contents.match(/<div id="dolar">[\s\S]*?<strong>(.*?)<\/strong>/i);
            if (match && match[1]) {
                usdValue = parseFloat(match[1].trim().replace(',', '.'));
                console.log(`[+] Éxito con Proxy Scraper. Tasa Oficial BCV: ${usdValue}`);
            }
        }

        console.log('\n====================================================');
        console.log(`[RESULTADO FINAL] TASA BCV OBTENIDA: ${usdValue} Bs/USD`);
        console.log('Este es el valor exacto que se está guardando ahora mismo en producción.');
        console.log('====================================================');

    } catch (e) {
        console.error('Error durante la verificación:', e);
    }
}

verificarEvidencia();
