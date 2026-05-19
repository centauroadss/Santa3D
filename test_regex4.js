const { extractFechaPago } = require('./lib/copa2026/ocr-extractors.ts');
require('ts-node').register();

const texts = [
  "FECHA Y HORA\n07/05/2026 10:00AM",
  "FECHA\n06/05/202602:50:03AM",
  "FECHA\n06-05-2026",
  "FECHA\n06.05.2026",
  "FECHA\n06/05/26",
  "FECHA\n06 de mayo de 2026",
  "FECHA\n06l05l2026",
  "FECHA\n06I05I2026",
  "FECHA\n06|05|2026",
  "FECHA\nO6/O5/2O26",
  "FECHA\nQ6/05/2026"
];

for (const text of texts) {
  const t = require('./lib/copa2026/ocr-extractors.ts').extractFechaPago(text);
  console.log(`"${text.replace(/\n/g, '\\n')}" =>`, t);
}
