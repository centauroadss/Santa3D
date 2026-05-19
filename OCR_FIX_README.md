# OCR Fixes y Mejoras

## BUG #5: Extracción de Fecha de Pago Móvil

**Problema:** La función `extractFechaPago` fallaba al extraer la fecha del comprobante cuando el OCR no incluía espacios (ej. `06/05/202602:50:03AM`), confundía caracteres numéricos (ej. `O6` en vez de `06`) o usaba formatos alternativos. Como consecuencia, el sistema asumía la fecha actual por defecto, usando una tasa de cambio del BCV incorrecta para validar el monto de la transferencia y rechazando pagos válidos.

**Solución:** Se implementó una versión robusta de `extractFechaPago` con 9 medidas defensivas:

| # | Medida | Cubre el caso de… |
|---|---|---|
| M1 | Múltiples labels | FECHA, FECHA Y HORA, FECHA DE LA OPERACIÓN, F:, DATE, etc. |
| M2 | Múltiples formatos | DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, DD/MM/YY, "06 de mayo de 2026" |
| M3 | Separadores OCR | / mal leído como I, l, \|, 1, . |
| M4 | Dígitos OCR | 0↔O/Q, 1↔I/l/\| sólo en contexto numérico |
| M5 | Plausibilidad | día 1-31, mes 1-12, fecha construible (rechaza 31/02) |
| M6 | Scoring por label | la fecha cerca de "FECHA" gana sobre cualquier otra en el texto |
| M7 | Rango temporal | rechaza años fuera de [2024, 2035] o > hoy+7 días |
| M8 | Recorte de hora | elimina HH:MM:SS(AM\|PM)? ANTES de parsear → 02:50:03 ya no se confunde con fecha |
| M9 | Fallback null | si nada matchea, devuelve null (NO inventa una fecha basura) |

**Verificación:**
Se crearon pruebas unitarias en `tests/unit/ocr-extractors.test.ts` que validan el comprobante exacto reportado (Raul Dhoy) y diversas permutaciones de ruido de OCR.

**Acciones post-despliegue:**
Al procesar las imágenes previamente problemáticas, la validación del OCR ahora debe retornar la fecha correcta (ej. `2026-05-06`) y utilizar la tasa histórica del BCV correspondiente.
