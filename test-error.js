const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.text().includes('Error')) {
                console.log('BROWSER CONSOLE:', msg.text());
            }
        });
        page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
        
        await page.goto('http://localhost:3000/copa2026/inscripcion', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
    } catch (e) {
        console.error("SCRIPT ERROR:", e);
    }
})();
