const tests = [
  "06/05/2026 02:50:03AM",
  "06/05/202602:50:03AM",
  "06/05/2026 02:50:03 AM",
  "O6/05/2026 02:50:03AM",
  "06/O5/2026 02:50:03AM",
  "06-05-2026 02:50:03AM",
  "06/05/26 02:50:03AM"
];

function extractFechaPago(text) {
  const candidates = [];
  candidates.push(text);
  const re = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
  for (const m of text.matchAll(re)) candidates.push(m[0]);

  for (const c of candidates) {
    const m = c.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
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
