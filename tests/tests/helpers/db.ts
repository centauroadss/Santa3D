/**
 * Helpers de BD para tests integrales.
 */

import { prisma } from '@/lib/prisma';
import { DateTime } from 'luxon';

export const TZ = 'America/Caracas';

/** Crea un Date que representa la medianoche del día dado en Caracas. */
export function caracasDay(year: number, month: number, day: number): Date {
  return DateTime.fromObject({ year, month, day }, { zone: TZ })
    .startOf('day')
    .toJSDate();
}

/** Construye un Date a partir de un ISO local Caracas. */
export function caracasInstant(iso: string): Date {
  return DateTime.fromISO(iso, { zone: TZ }).toJSDate();
}

/** Limpia toda la tabla. Llamar en beforeEach. */
export async function limpiarBcv() {
  await prisma.tasaBcvHistorico.deleteMany({});
}
