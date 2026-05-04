const axios = require('axios');
const https = require('https');

(async () => {
    const response = await axios.get('https://www.bcv.org.ve/', {
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0'
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
    const html = response.data;
    
    // Buscar Fecha Valor:
    const index = html.indexOf('Fecha Valor:');
    if (index !== -1) {
        console.log("Contexto encontrado:", html.substring(index - 20, index + 100).replace(/\s+/g, ' '));
        
        // Extraer la fecha con Regex
        const match = html.match(/Fecha Valor:\s*([a-zA-ZáéíóúÁÉÍÓÚ]+,\s*\d{1,2}\s*[a-zA-Z]+\s*\d{4})/i);
        if (match) {
            console.log("Fecha Extraída Exacta:", match[1]);
        }
    } else {
        console.log("No se encontró 'Fecha Valor:'");
    }
})();
