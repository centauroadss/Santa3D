const Tesseract = require('tesseract.js');
const fs = require('fs');

async function main() {
  if (!fs.existsSync('dummy.jpg')) {
    console.error("dummy.jpg not found");
    return;
  }
  const buffer = fs.readFileSync('dummy.jpg');

  console.log("Running Tesseract directly on dummy.jpg...");
  const result = await Tesseract.recognize(buffer, 'spa+eng', { logger: m => console.log(m) });
  
  const text = result.data.text;
  console.log("\n\n===== RAW EXTRACTED TEXT =====");
  console.log(text);
  console.log("==============================\n\n");

  // Regex testing
  const regex = /(?:\b|Bs\.?\s*|Monto:\s*|Monto\s*|BsS\s*)((?:[0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)(?:[.,][0-9]{1,2})?)\b/gi;
  const matches = [...text.matchAll(regex)];
  console.log("Monto matches:", matches.map(m => m[1]));

  const conceptoRegex = /(?:concepto|descripción|nota|motivo|detalle|asunto)s?:?\s*([^\n\r]+)/i;
  const conceptoMatch = text.match(conceptoRegex);
  console.log("Concepto match:", conceptoMatch ? conceptoMatch[1].trim() : null);
}

main().catch(console.error);
