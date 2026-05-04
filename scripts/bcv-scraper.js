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
        
        // Extraer el valor usando regex ya que no tenemos cheerio.
        // El HTML es típicamente: <div id="dolar">...<strong> 36,1234 </strong>...</div>
        const match = html.match(/id="dolar".*?<strong>\s*([\d,]+)\s*<\/strong>/is);
        if (!match || !match[1]) {
            throw new Error('No se pudo encontrar el valor del dólar en el HTML');
        }
        
        const usdText = match[1].trim();
        // El BCV usa coma para decimales (ej. 36,1234)
        const usdValue = parseFloat(usdText.replace(',', '.'));
        
        if (isNaN(usdValue)) {
            throw new Error(`El valor extraído no es un número válido: ${usdText}`);
        }

        console.log(`[BCV Scraper] Tasa USD extraída: ${usdValue}`);

        // Usamos el inicio del día (medianoche) local como fecha
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const record = await prisma.tasaBcvHistorico.upsert({
            where: { fecha: hoy },
            update: {
                tasaUsdBs: usdValue,
                fuenteUrl: 'https://www.bcv.org.ve/'
            },
            create: {
                fecha: hoy,
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
