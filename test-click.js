const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log("Launching browser...");
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
        
        console.log("Navigating to localhost:3000/copa2026/inscripcion...");
        await page.goto('http://localhost:3000/copa2026/inscripcion', { waitUntil: 'networkidle2' });
        
        console.log("Filling form A...");
        await page.type('input[name="nombre"]', 'Test Name');
        await page.type('input[name="apellido"]', 'Test Lastname');
        await page.type('input[name="cedulaIdentidad"]', 'V-12345678');
        await page.type('input[name="telefono"]', '4141234567');
        await page.type('input[name="email"]', 'test@example.com');
        
        console.log("Clicking checkboxes...");
        await page.evaluate(() => {
            document.querySelectorAll('input[type="checkbox"]').forEach(el => el.click());
        });
        
        console.log("Clicking submit...");
        await page.click('button[type="submit"]');
        
        console.log("Waiting a bit to see if error occurs...");
        await new Promise(r => setTimeout(r, 2000));
        
        await browser.close();
        console.log("Done.");
    } catch (e) {
        console.error("SCRIPT ERROR:", e);
    }
})();
