// BCV Scraper - Extrae la tasa USD/Bs del Banco Central de Venezuela
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignorar certificados SSL inválidos del BCV

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('[BCV Scraper] Iniciando extracción...');
    try {
        // fetch nativo en Node 18+
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch('https://www.bcv.org.ve/', {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const html = await response.text();
        
        // La clase del strong puede variar, así que usamos [^>]* para capturar cualquier atributo extra
        const match = html.match(/id="dolar".*?<strong[^>]*>\s*([\d,]+)\s*<\/strong>/is);
        if (!match || !match[1]) {
            throw new Error('No se pudo encontrar el valor del dólar en el HTML');
        }
        
        const usdText = match[1].trim();
        const usdValue = parseFloat(usdText.replace(',', '.'));
        
        if (isNaN(usdValue)) {
            throw new Error(`El valor extraído no es un número válido: ${usdText}`);
        }

        // Extraer la fecha valor real desde el atributo content de dc:date
        const matchDate = html.match(/Fecha Valor:.*?content="([^"]+)"/is);
        let fechaValor = new Date();
        if (matchDate && matchDate[1]) {
            fechaValor = new Date(matchDate[1]);
        } else {
            console.warn('[BCV Scraper] No se pudo extraer la Fecha Valor del HTML, usando fecha actual + 1.');
            fechaValor.setHours(0, 0, 0, 0);
            fechaValor.setDate(fechaValor.getDate() + 1);
        }

        console.log(`[BCV Scraper] Tasa USD extraída: ${usdValue}`);
        console.log(`[BCV Scraper] Fecha Valor extraída: ${fechaValor.toISOString()}`);

        // Usamos el inicio del día (medianoche) local como fecha de ejecución
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const record = await prisma.tasaBcvHistorico.upsert({
            where: { fecha: hoy },
            update: {
                fechaValor: fechaValor,
                tasaUsdBs: usdValue,
                fuenteUrl: 'https://www.bcv.org.ve/'
            },
            create: {
                fecha: hoy,
                fechaValor: fechaValor,
                tasaUsdBs: usdValue,
                fuenteUrl: 'https://www.bcv.org.ve/'
            }
        });

        console.log('[BCV Scraper] Éxito. Registro guardado:', record);
        
    } catch (e) {
        console.error('[BCV Scraper] Falló la extracción:', e.message);
        process.exit(1); // Salir con error para que cron registre la falla
    } finally {
        await prisma.$disconnect();
    }
}

main();
