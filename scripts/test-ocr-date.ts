import { extractFechaPago } from '../lib/copa2026/ocr-extractors';

const tests = [
  'FECHA: 06/05/2026 02:50:03AM',
  '06 05 2026',
  '06,05,2026',
  '06.05.2026',
  '06/05/2026',
  '0610512026'
];

for (const t of tests) {
  console.log(`Test: "${t}" -> Result: ${extractFechaPago(t)}`);
}
