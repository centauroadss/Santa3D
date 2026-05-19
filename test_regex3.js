const MESES_ES = {
  enero: '01', feb: '02', febrero: '02', marzo: '03', abr: '04', abril: '04',
  mayo: '05', jun: '06', junio: '06', jul: '07', julio: '07', ago: '08',
  agosto: '08', sep: '09', sept: '09', septiembre: '09', oct: '10', octubre: '10',
  nov: '11', noviembre: '11', dic: '12', diciembre: '12'
};

function isValidDate(y, m, d) {
  if (y < 2024 || y > 2035) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  const hoyMas7 = new Date();
  hoyMas7.setDate(hoyMas7.getDate() + 7);
  if (date > hoyMas7) return false;
  return true;
}

function normalizeForCompare(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function lines(text) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
}

const ALL_KNOWN_LABELS = [
  'NÚMERO DE REFERENCIA', 'NUMERO DE REFERENCIA', 'REFERENCIA', 'FECHA',
  'NÚMERO CELULAR DE ORIGEN', 'NUMERO CELULAR DE ORIGEN', 'NÚMERO CELULAR DE DESTINO',
  'NUMERO CELULAR DE DESTINO', 'IDENTIFICACIÓN RECEPTOR', 'IDENTIFICACION RECEPTOR',
  'BANCO EMISOR', 'BANCO RECEPTOR', 'MONTO DE LA OPERACIÓN', 'MONTO DE LA OPERACION',
  'MONTO', 'CONCEPTO', 'DESCRIPCIÓN', 'DESCRIPCION', 'MOTIVO', 'DETALLE', 'NOTA', 'ASUNTO'
];

function valueAfterLabel(text, labels) {
  const all = lines(text);
  const labelsNorm = labels.map(normalizeForCompare);

  for (let i = 0; i < all.length; i++) {
    const lineNorm = normalizeForCompare(all[i]);

    for (const lbl of labelsNorm) {
      const idx = lineNorm.indexOf(lbl);
      if (idx < 0) continue;

      const afterIdxOriginal = idx + lbl.length;
      const reOriginal = new RegExp(lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchOriginal = all[i].match(reOriginal);
      if (matchOriginal && matchOriginal.index !== undefined) {
        const remainder = all[i]
          .substring(matchOriginal.index + matchOriginal[0].length)
          .replace(/^[:\-\s]+/, '').trim();
        if (remainder.length > 0) return remainder;
      }

      for (let j = i + 1; j < all.length; j++) {
        const candNorm = normalizeForCompare(all[j]);
        const isOtraEtiqueta = ALL_KNOWN_LABELS.some((l) => candNorm.startsWith(normalizeForCompare(l)));
        if (!isOtraEtiqueta) return all[j];
      }
    }
  }
  return null;
}

function extractFechaPago(text) {
  const candidates = [];

  const rawLabel = valueAfterLabel(text, [
    'FECHA Y HORA', 'FECHA DE LA OPERACIÓN', 'FECHA DE LA OPERACION',
    'FECHA', 'DATE', 'F:'
  ]);
  if (rawLabel) candidates.push({ text: rawLabel, score: 10 });

  candidates.push({ text, score: 1 });

  let bestDate = null;
  let bestScore = -1;

  for (const cand of candidates) {
    // BUG FIX M8: \b does not work for \n boundaries easily if there are no spaces.
    let cleaned = cand.text.replace(/(?:[0-2]?[0-9])[O0o:\.]+[0-5][0-9](?:[O0o:\.]+[0-5][0-9])?\s*(?:AM|PM|am|pm)?/ig, ' ');
    // remove the \b
    
    const lowerCleaned = cleaned.toLowerCase();
    const textPattern = /(\d{1,2})\s+(?:de\s+)?(enero|feb|febrero|marzo|abr|abril|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|septiembre|oct|octubre|nov|noviembre|dic|diciembre)\s+(?:de\s+)?(\d{4}|\d{2})/g;
    for (const match of lowerCleaned.matchAll(textPattern)) {
      let y = parseInt(match[3], 10);
      if (y < 100) y += 2000;
      const m = parseInt(MESES_ES[match[2]], 10);
      const d = parseInt(match[1], 10);
      if (isValidDate(y, m, d)) {
        return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      }
    }

    cleaned = cleaned
      .replace(/[OoQq]/g, '0')
      .replace(/[Il\|]/g, '1')
      .replace(/[Il\|1\.]/g, '/'); 

    const numPattern = /(\d{1,2})\/+(\d{1,2})\/+(\d{4}|\d{2})/g;
    
    for (const match of cleaned.matchAll(numPattern)) {
      let y = parseInt(match[3], 10);
      if (y < 100) y += 2000; 
      
      let p1 = parseInt(match[1], 10);
      let p2 = parseInt(match[2], 10);
      
      if (isValidDate(y, p2, p1)) {
        const ds = `${y}-${p2.toString().padStart(2, '0')}-${p1.toString().padStart(2, '0')}`;
        if (cand.score > bestScore) {
          bestScore = cand.score;
          bestDate = ds;
        }
      } else if (isValidDate(y, p1, p2)) { 
         const ds = `${y}-${p1.toString().padStart(2, '0')}-${p2.toString().padStart(2, '0')}`;
         if (cand.score > bestScore) {
           bestScore = cand.score;
           bestDate = ds;
         }
      }
    }
  }

  return bestDate;
}

const tests = [
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

for (const t of tests) {
  console.log(`"${t.replace(/\n/g, '\\n')}" =>`, extractFechaPago(t));
}
