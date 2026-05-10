const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.error('CLIENT ERROR EVENT:');
    console.error(err.message);
    console.error(err.stack);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:3000/copa2026/inscripcion');
  await page.waitForTimeout(2000);
  
  await page.fill('input[name="nombre"]', 'Test');
  await page.fill('input[name="apellido"]', 'Test');
  await page.fill('input[name="cedulaIdentidad"]', 'V-12345678');
  await page.fill('input[name="telefono"]', '4141234567');
  await page.fill('input[name="email"]', 'test@test.com');
  
  // Checkboxes
  await page.check('input[name="aceptaTerminos"]');
  await page.check('input[name="cesionDerechos"]');
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
