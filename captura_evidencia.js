const { chromium } = require('@playwright/test');
const { SignJWT } = require('jose');

(async () => {
  const secret = new TextEncoder().encode('default-secret-change-in-production');
  const token = await new SignJWT({
    id: 'admin-123',
    email: 'admin@test.com',
    role: 'ADMIN'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  await context.addCookies([{
    name: 'admin_token',
    value: token,
    domain: 'copa2026.centauroads.com',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax'
  }]);

  const page = await context.newPage();
  
  await page.goto('https://copa2026.centauroads.com/admin/configuracion');
  
  await page.evaluate((token) => {
    localStorage.setItem('admin_token', token);
  }, token);

  // Recargar para que el cliente lea el localStorage
  await page.reload();

  // Esperar a que la tabla cargue
  await page.waitForSelector('text=Sincronizar BCV Ahora', { timeout: 15000 });
  await page.waitForTimeout(3000); // Esperar a que las peticiones de fetch terminen

  await page.screenshot({ path: 'C:\\Users\\joaou\\.gemini\\antigravity\\brain\\37ed9eb8-377a-443f-b016-eb5854eaf3b3\\artifacts\\captura_bcv.png', fullPage: true });

  await browser.close();
  console.log('Captura guardada con éxito.');
})();
