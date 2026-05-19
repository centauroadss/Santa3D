const tests = [
  "06/05/2026 02:50:03AM",
  "06/05/202602:50:03AM",
  "06/05/2026 02:50:03 AM",
  "O6/05/2026 02:50:03AM",
  "06/O5/2026 02:50:03AM",
  "06-05-2026 02:50:03AM",
  "06/05/26 02:50:03AM"
];

function fixOcrDigits(s) {
  return s
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[lL](?=\d)/g, '1')
    .replace(/[Bb](?=\d{4,})/g, '8') 
    .replace(/[Ss](?=\d{2,})/g, '5');
}

function extractFechaPago(text) {
  const candidates = [];
  
  // 1. Label fallback
  candidates.push(text);
  
  // Cleaned text for regex
  const cleanedText = fixOcrDigits(text);
  
  // 2. Más permisivo: acepta -, / o . y no requiere \b estricto al final
  const re = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g;
  
  for (const m of cleanedText.matchAll(re)) candidates.push(m[0]);

  for (const c of candidates) {
    const cleanedC = fixOcrDigits(c);
    const m = cleanedC.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (m) {
      const [, d, mo, y] = m;
      return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return null;
}

for (const t of tests) {
  console.log(`"${t}" =>`, extractFechaPago(t));
}
