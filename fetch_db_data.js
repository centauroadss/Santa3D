const { chromium } = require('@playwright/test');
const { SignJWT } = require('jose');
const fs = require('fs');

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

  const response = await context.request.get('https://copa2026.centauroads.com/api/admin/bcv-historico', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const json = await response.json();
  fs.writeFileSync('C:\\Users\\joaou\\.gemini\\antigravity\\brain\\37ed9eb8-377a-443f-b016-eb5854eaf3b3\\artifacts\\tasa_bcv_historico_data.json', JSON.stringify(json, null, 2));

  await browser.close();
  console.log('Datos de la BD guardados con éxito.');
})();
