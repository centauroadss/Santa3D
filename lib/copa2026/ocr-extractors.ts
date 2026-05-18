/**
 * Extractores puros del texto OCR de comprobantes de Pago Móvil.
 *
 * Estrategia:
 *   1. Parser LÍNEA-A-LÍNEA: busca etiquetas conocidas y toma el valor de la
 *      línea siguiente (cómo se ven los recibos Banesco/Mercantil/Venezuela).
 *   2. Fallback REGEX libre cuando el formato es plano.
 *   3. Tolerancia a errores típicos de OCR: O↔0, I↔1, l↔1, S↔5, B↔8.
 *
 * Bancos soportados (formatos verificados):
 *   - Banesco
 *   - Mercantil
 *   - Venezuela
 *   - Bancaribe
 *   - BNC
 *   - Provincial (BBVA)
 *
 * Todas las funciones son PURAS — fáciles de testear con fixtures de texto.
 */

// ─── Utilidades ────────────────────────────────────────────────────────────

/** Quita acentos y normaliza espacios para comparación insensible. */
function normalizeForCompare(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Reemplaza confusiones típicas de OCR en contextos NUMÉRICOS. */
function fixOcrDigits(s: string): string {
  return s
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[lL](?=\d)/g, '1')
    .replace(/[Bb](?=\d{4,})/g, '8') // Bs adelante no, número largo sí
    .replace(/[Ss](?=\d{2,})/g, '5');
}

/** Parte el texto en líneas no vacías. */
function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Busca una línea que contenga alguna de las etiquetas. Devuelve el VALOR:
 *  - si la línea tiene contenido después de la etiqueta → ese contenido.
 *  - sino → la siguiente línea no vacía que NO sea otra etiqueta.
 */
function valueAfterLabel(text: string, labels: string[]): string | null {
  const all = lines(text);
  const labelsNorm = labels.map(normalizeForCompare);

  for (let i = 0; i < all.length; i++) {
    const lineNorm = normalizeForCompare(all[i]);

    for (const lbl of labelsNorm) {
      const idx = lineNorm.indexOf(lbl);
      if (idx < 0) continue;

      // ¿Valor en la misma línea, después de la etiqueta?
      const afterIdxOriginal = idx + lbl.length;
      // Re-localizar en el string original (porque normalizeForCompare puede
      // haber cambiado long). Usamos indexOf case-insensitive.
      const reOriginal = new RegExp(
        lbl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      const matchOriginal = all[i].match(reOriginal);
      if (matchOriginal && matchOriginal.index !== undefined) {
        const remainder = all[i]
          .substring(matchOriginal.index + matchOriginal[0].length)
          .replace(/^[:\-\s]+/, '')
          .trim();
        if (remainder.length > 0) return remainder;
      }

      // Sino: tomar la siguiente línea no etiqueta
      for (let j = i + 1; j < all.length; j++) {
        const candNorm = normalizeForCompare(all[j]);
        const isOtraEtiqueta = ALL_KNOWN_LABELS.some((l) =>
          candNorm.startsWith(normalizeForCompare(l))
        );
        if (!isOtraEtiqueta) return all[j];
      }
    }
  }
  return null;
}

// Lista global de etiquetas (para no confundir un valor con otra etiqueta)
const ALL_KNOWN_LABELS = [
  'NÚMERO DE REFERENCIA',
  'NUMERO DE REFERENCIA',
  'REFERENCIA',
  'FECHA',
  'NÚMERO CELULAR DE ORIGEN',
  'NUMERO CELULAR DE ORIGEN',
  'NÚMERO CELULAR DE DESTINO',
  'NUMERO CELULAR DE DESTINO',
  'IDENTIFICACIÓN RECEPTOR',
  'IDENTIFICACION RECEPTOR',
  'BANCO EMISOR',
  'BANCO RECEPTOR',
  'MONTO DE LA OPERACIÓN',
  'MONTO DE LA OPERACION',
  'MONTO',
  'CONCEPTO',
  'DESCRIPCIÓN',
  'DESCRIPCION',
  'MOTIVO',
  'DETALLE',
  'NOTA',
  'ASUNTO',
];

// ─── Referencia ────────────────────────────────────────────────────────────

export function extractReferencia(text: string): string | null {
  const raw = valueAfterLabel(text, [
    'NÚMERO DE REFERENCIA',
    'NUMERO DE REFERENCIA',
    'NRO. REFERENCIA',
    'N° REFERENCIA',
    'REFERENCIA',
    'COD. REFERENCIA',
  ]);

  let candidate = raw ?? '';
  if (!candidate) {
    // Fallback: línea con 8+ dígitos seguidos en cualquier parte
    const m = text.match(/\b(\d{8,15})\b/);
    candidate = m ? m[1] : '';
  }
  if (!candidate) return null;

  const digits = fixOcrDigits(candidate).replace(/\D/g, '');
  return digits.length >= 6 ? digits : null;
}

// ─── Monto ─────────────────────────────────────────────────────────────────

/**
 * Parsea un número en formato VENEZOLANO: miles="." decimal=","
 * Acepta: "2.470,56" → 2470.56
 *         "2470,56"  → 2470.56
 *         "2470.56"  → 2470.56 (formato US como fallback)
 */
export function parseMontoVE(raw: string): number | null {
  if (!raw) return null;
  let s = fixOcrDigits(raw).replace(/[^\d.,]/g, '');
  if (!s) return null;

  // Formato VE: si hay coma, ESA es la decimal; los puntos son miles
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if ((s.match(/\./g) || []).length >= 2) {
    // múltiples puntos → todos son miles
    s = s.replace(/\./g, '');
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function extractMonto(text: string): number | null {
  // 1. Por etiqueta
  const raw = valueAfterLabel(text, [
    'MONTO DE LA OPERACIÓN',
    'MONTO DE LA OPERACION',
    'MONTO',
    'IMPORTE',
    'TOTAL',
  ]);
  if (raw) {
    const rawClean = fixOcrDigits(raw);
    const matches = rawClean.match(/[\d.,]{2,}/g);
    if (matches && matches.length > 0) {
      // Take the last match which is usually the actual amount, skipping the '8' from '8s'
      const v = parseMontoVE(matches[matches.length - 1]);
      if (v !== null) return v;
    }
  }

  // 2. Fallback: cualquier "Bs.X,XX" o "Bs X,XX" en el texto
  const re = /(?:Bs|BsS|B[s5])\.?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/gi;
  const matches = [...text.matchAll(re)];
  if (matches.length > 0) {
    // Tomamos el MAYOR (suele ser el monto principal de la operación)
    const vals = matches
      .map((m) => parseMontoVE(m[1]))
      .filter((v): v is number => v !== null);
    if (vals.length > 0) return Math.max(...vals);
  }

  return null;
}

// ─── Concepto ──────────────────────────────────────────────────────────────

export function extractConcepto(text: string): string | null {
  const raw = valueAfterLabel(text, [
    'CONCEPTO',
    'DESCRIPCIÓN',
    'DESCRIPCION',
    'MOTIVO',
    'DETALLE',
    'NOTA',
    'ASUNTO',
  ]);
  if (!raw) return null;
  // Limpiar (puede tener basura al final como "Agregar a Pagos")
  return raw
    .replace(/Agregar.*$/i, '')
    .replace(/Aceptar.*$/i, '')
    .replace(/Descargar.*$/i, '')
    .trim() || null;
}

// ─── Fecha del pago ────────────────────────────────────────────────────────

export function extractFechaPago(text: string): string | null {
  // 1. Por etiqueta FECHA
  const raw = valueAfterLabel(text, ['FECHA', 'DATE']);
  const candidates: string[] = [];
  if (raw) candidates.push(raw);
  // 2. Cualquier patrón DD/MM/YYYY en el texto
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

// ─── Cédula del receptor ───────────────────────────────────────────────────

export function extractCedulaReceptor(text: string): string | null {
  const raw = valueAfterLabel(text, [
    'IDENTIFICACIÓN RECEPTOR',
    'IDENTIFICACION RECEPTOR',
    'CÉDULA RECEPTOR',
    'CEDULA RECEPTOR',
    'CI RECEPTOR',
  ]);
  if (!raw) return null;
  const m = raw.match(/[VEPvep]?-?\s*(\d{6,10})/);
  return m ? `V-${m[1]}` : null;
}

// ─── Teléfono destino ──────────────────────────────────────────────────────

export function extractTelefonoDestino(text: string): string | null {
  const raw = valueAfterLabel(text, [
    'NÚMERO CELULAR DE DESTINO',
    'NUMERO CELULAR DE DESTINO',
    'TELÉFONO DESTINO',
    'TELEFONO DESTINO',
  ]);
  if (!raw) return null;
  const digits = fixOcrDigits(raw).replace(/\D/g, '');
  if (digits.length >= 10) {
    // Normalizar a 11 dígitos con 0 inicial
    if (digits.length === 10) return '0' + digits;
    if (digits.length === 11 && digits.startsWith('0')) return digits;
    if (digits.length === 12 && digits.startsWith('58')) return '0' + digits.slice(2);
    return digits;
  }
  return null;
}

// ─── Banco emisor ──────────────────────────────────────────────────────────

const BANCO_CODIGOS: Record<string, string> = {
  BANESCO: '0134',
  MERCANTIL: '0105',
  VENEZUELA: '0102',
  PROVINCIAL: '0108',
  BBVA: '0108',
  BANCARIBE: '0114',
  BNC: '0191',
  BOD: '0116',
  EXTERIOR: '0115',
  SOFITASA: '0137',
  BANPLUS: '0174',
  ACTIVO: '0171',
  CARONI: '0128',
  BICENTENARIO: '0175',
  TESORO: '0163',
  PLAZA: '0138',
  FONDO: '0151',
  BANGENTE: '0146',
  AGRICOLA: '0166',
};

export function extractBancoEmisor(text: string): { nombre: string; codigo: string } | null {
  const raw = valueAfterLabel(text, ['BANCO EMISOR', 'BANCO ORIGEN']);
  const upper = normalizeForCompare(raw ?? text);
  for (const [nombre, codigo] of Object.entries(BANCO_CODIGOS)) {
    if (upper.includes(nombre)) return { nombre, codigo };
  }
  return null;
}

// ─── Punto de entrada combinado ────────────────────────────────────────────

export interface OcrFields {
  referencia: string | null;
  monto: number | null;
  concepto: string | null;
  fechaPago: string | null;        // ISO YYYY-MM-DD
  cedulaReceptor: string | null;   // "V-XXXXXXXX"
  telefonoDestino: string | null;  // "04XXXXXXXXX"
  bancoEmisorNombre: string | null;
  bancoEmisorCodigo: string | null;
}

export function extractAllFields(text: string): OcrFields {
  const banco = extractBancoEmisor(text);
  return {
    referencia: extractReferencia(text),
    monto: extractMonto(text),
    concepto: extractConcepto(text),
    fechaPago: extractFechaPago(text),
    cedulaReceptor: extractCedulaReceptor(text),
    telefonoDestino: extractTelefonoDestino(text),
    bancoEmisorNombre: banco?.nombre ?? null,
    bancoEmisorCodigo: banco?.codigo ?? null,
  };
}
