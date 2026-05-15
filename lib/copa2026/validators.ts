/**
 * Validadores compartidos del módulo de inscripción.
 *
 * Centralizan en un solo módulo:
 *   - Email
 *   - Instagram handle
 *   - Teléfono venezolano (móvil)
 *   - Cálculo de edad a partir de fecha de nacimiento
 *   - Validación del campo `concepto` del pago contra nombre + cédula
 *   - Validación de longitud de biografía
 *
 * Se usan en:
 *   - InscripcionFormA  (validación en cliente)
 *   - InscripcionFormB  (validación en cliente)
 *   - API /copa2026/inscripcion  (validación en servidor)
 *   - tests unitarios e integrales
 *
 * Reglas que el usuario definió:
 *   - Email debe tener `@` y estructura válida.
 *   - Instagram debe iniciar con `@`.
 *   - Teléfono venezolano: prefijos 412/422 (Movilnet), 414/424 (Movistar),
 *     416/426 (Digitel). Máximo 10 dígitos significativos (sin contar `0` ni `+58`).
 *   - El concepto del pago debe contener el nombre Y la cédula del participante.
 *   - Biografía: hasta 250 caracteres.
 */

// ─── EMAIL ──────────────────────────────────────────────────────────────────

/**
 * RFC 5322 simplificado. Requiere:
 *   - parte local con letras/números/._%+-
 *   - exactamente UN `@`
 *   - dominio con punto y TLD ≥ 2 chars
 */
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(s: string): boolean {
  if (typeof s !== 'string') return false;
  const trimmed = s.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  if ((trimmed.match(/@/g) || []).length !== 1) return false;
  return EMAIL_RE.test(trimmed);
}

// ─── INSTAGRAM ──────────────────────────────────────────────────────────────

/**
 * Handle de Instagram: empieza con `@`, sólo letras/números/_/. (no espacios,
 * no caracteres especiales), 1–30 chars después del `@`.
 */
const INSTAGRAM_RE = /^@[a-zA-Z0-9._]{1,30}$/;

export function isValidInstagram(s: string): boolean {
  if (typeof s !== 'string') return false;
  return INSTAGRAM_RE.test(s.trim());
}

// ─── TELÉFONO VENEZOLANO ────────────────────────────────────────────────────

const VE_PREFIXES = ['412', '422', '414', '424', '416', '426'] as const;

/**
 * Acepta:
 *   - `04125551234`        (con 0 inicial, total 11 chars)
 *   - `+584125551234`      (con código de país +58, total 13 chars)
 *   - `584125551234`       (con 58 sin +)
 *   - `4125551234`         (sólo 10 dígitos significativos)
 * Rechaza otros prefijos o longitudes.
 *
 * Devuelve `{ ok, normalized }` donde normalized = "0412XXXXXXX" si ok.
 */
export function validateVenezuelanPhone(s: string): {
  ok: boolean;
  normalized?: string;
  reason?: string;
} {
  if (typeof s !== 'string') return { ok: false, reason: 'No es texto' };

  const digits = s.replace(/[\s\-()]/g, '').replace(/^\+/, '');
  let core: string;

  if (digits.startsWith('58')) {
    core = digits.slice(2);
  } else if (digits.startsWith('0')) {
    core = digits.slice(1);
  } else {
    core = digits;
  }

  if (!/^\d{10}$/.test(core)) {
    return { ok: false, reason: 'Debe tener 10 dígitos significativos' };
  }

  const prefix = core.slice(0, 3);
  if (!VE_PREFIXES.includes(prefix as (typeof VE_PREFIXES)[number])) {
    return {
      ok: false,
      reason: `Prefijo ${prefix} no es válido. Use 412/422, 414/424 o 416/426.`,
    };
  }

  return { ok: true, normalized: '0' + core };
}

// ─── EDAD ───────────────────────────────────────────────────────────────────

/**
 * Calcula edad en años cumplidos al día `at` (default: hoy en UTC).
 * Retorna 0 si la fecha es futura o inválida.
 */
export function calculateAge(birthDate: Date | string, at: Date = new Date()): number {
  const b = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (!(b instanceof Date) || isNaN(b.getTime())) return 0;
  if (+b > +at) return 0;

  let age = at.getUTCFullYear() - b.getUTCFullYear();
  const m = at.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && at.getUTCDate() < b.getUTCDate())) {
    age--;
  }
  return Math.max(0, age);
}

export const EDAD_MINIMA = 18;

export function esMayorDeEdad(birthDate: Date | string, at?: Date): boolean {
  return calculateAge(birthDate, at) >= EDAD_MINIMA;
}

// ─── BIOGRAFÍA ──────────────────────────────────────────────────────────────

export const BIOGRAFIA_MAX = 250;

export function validateBiografia(s: string): {
  ok: boolean;
  length: number;
  reason?: string;
} {
  const text = (s ?? '').toString();
  const length = text.length;
  if (length === 0) return { ok: false, length, reason: 'La biografía no puede estar vacía' };
  if (length > BIOGRAFIA_MAX)
    return { ok: false, length, reason: `Máximo ${BIOGRAFIA_MAX} caracteres` };
  return { ok: true, length };
}

// ─── CONCEPTO DEL PAGO ──────────────────────────────────────────────────────

/** Quita acentos y normaliza espacios. */
function normalize(s: string): string {
  return (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrae sólo los dígitos de una cédula (descarta V-, E-, P-, espacios, puntos). */
export function extractCedulaDigits(s: string): string {
  return (s ?? '').toString().replace(/\D/g, '');
}

/**
 * Verifica que el `concepto` contenga el nombre Y la cédula del participante.
 *
 * Reglas:
 *   - Case-insensitive y sin acentos.
 *   - El nombre debe aparecer al menos parcialmente (primer nombre + apellido
 *     o nombre completo).
 *   - La cédula debe aparecer como secuencia de dígitos contigua.
 */
export function validateConcepto(
  concepto: string,
  nombreCompleto: string,
  cedula: string
): { ok: boolean; reason?: string; details: { tieneNombre: boolean; tieneCedula: boolean } } {
  const concept = normalize(concepto);
  const nombreNorm = normalize(nombreCompleto);
  const cedDigits = extractCedulaDigits(cedula);

  // Cédula: secuencia de dígitos exacta (mínimo 6 dígitos para evitar falsos positivos)
  const tieneCedula =
    cedDigits.length >= 6 &&
    extractCedulaDigits(concepto).includes(cedDigits);

  // Nombre: al menos una palabra del nombre completo aparece en el concepto.
  // Para mayor seguridad, exigimos AL MENOS la primera palabra del nombre
  // Y la primera palabra del apellido (si hay >= 2 palabras).
  const palabras = nombreNorm.split(' ').filter((w) => w.length >= 2);
  let tieneNombre = false;
  if (palabras.length === 1) {
    tieneNombre = concept.includes(palabras[0]);
  } else if (palabras.length >= 2) {
    // Primera palabra (nombre) Y la última (apellido) deben aparecer.
    tieneNombre =
      concept.includes(palabras[0]) && concept.includes(palabras[palabras.length - 1]);
  }

  if (tieneNombre && tieneCedula) {
    return { ok: true, details: { tieneNombre, tieneCedula } };
  }

  const faltantes: string[] = [];
  if (!tieneNombre) faltantes.push('nombre');
  if (!tieneCedula) faltantes.push('cédula');
  return {
    ok: false,
    reason: `El concepto no contiene ${faltantes.join(' ni ')} del participante`,
    details: { tieneNombre, tieneCedula },
  };
}

// ─── COSTO USD POR CATEGORÍA ────────────────────────────────────────────────

export const COSTO_USD = {
  UNA: 5,
  AMBAS: 10,
} as const;

export function costoUsdPorCategoria(cat: 'RENDER' | 'IA' | 'AMBAS'): number {
  return cat === 'AMBAS' ? COSTO_USD.AMBAS : COSTO_USD.UNA;
}
