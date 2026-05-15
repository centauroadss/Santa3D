/**
 * Helpers para tests del scraper BCV.
 * Genera fixtures HTML que coinciden con el formato de bcv.org.ve.
 */

const MESES_NOMBRE = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DIAS_NOMBRE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export interface BcvFixture {
  year: number;
  month: number;
  day: number;
  tasa: string; // formato BCV: "508,60040000"
}

/**
 * Construye HTML de fixture con padding suficiente para pasar MIN_HTML_LENGTH.
 */
export function makeBcvHtml(f: BcvFixture): string {
  const date = new Date(Date.UTC(f.year, f.month - 1, f.day));
  const diaSemana = DIAS_NOMBRE[date.getUTCDay()];
  const mesNombre = MESES_NOMBRE[f.month];
  const padding = '<!-- '.repeat(200) + ' -->'.repeat(200);
  return `<!DOCTYPE html><html><body>
    ${padding}
    <div class="recuadrotsmc">
      <div class="col-sm-6">
        <span class="view-mode rate-rate">EUR</span>
        <span class="centrado">596,60352721</span>
      </div>
      <div class="col-sm-6">
        <span class="view-mode rate-rate">USD</span>
        <span class="centrado">${f.tasa}</span>
      </div>
    </div>
    <span class="date-display-single">Fecha Valor: ${diaSemana}, ${f.day} ${mesNombre} ${f.year}</span>
    ${padding}
  </body></html>`;
}

/**
 * Construye un fetcher inyectable para syncBcv() que devuelve siempre el mismo HTML.
 */
export function fetcherDe(f: BcvFixture): () => Promise<string> {
  return async () => makeBcvHtml(f);
}
