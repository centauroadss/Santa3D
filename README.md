# Copa 2026

## Diferencia V1 vs V2 (BCV Sync)

El sistema de sincronización de tasas del Banco Central de Venezuela (BCV) ha sido actualizado a la versión V2 para prevenir fallas silenciosas e inserciones de datos basura que ocurrieron en V1.

**Problema en V1:**
Si el scraper (cron) se ejecutaba por la mañana antes de que el BCV actualizara sus tasas para el día, el código tomaba la tasa del día anterior. Como la fecha de ejecución era "hoy" y la fecha valor parseada seguía siendo "hoy", se insertaba una fila donde `fecha == fechaValor`, rompiendo la cadena temporal y almacenando datos redundantes e incorrectos.

**Solución en V2:**
Se implementaron 3 capas de invariantes y seguridad:
1. **Reglas Puras (`bcv-invariants.ts`)**: Lógica estricta (R1, R2, R3) que valida que `fechaValor > fecha` y que no haya saltos temporales, centralizada como única fuente de la verdad.
2. **Capa ORM/Scripting (`bcv-sync.ts`)**: El proceso de sincronización ahora hace `skip` inmediato y no toca la base de datos si `fechaValor <= fecha`.
3. **Capa Base de Datos (CHECK Constraint)**: Se añadió `CONSTRAINT check_fv_gt_fecha CHECK (fechaValor > fecha)` a la tabla `tasa_bcv_historico` para impedir la corrupción incluso si se ignora el código.

**Implementación de Diagnóstico y Recuperación:**
- `scripts/backfill-bcv.ts`: Script que arregla la base de datos de manera transaccional. Hace rollback automático si el arreglo viola alguna regla de V2.
- `scripts/diagnose-bcv.ts`: Script para CI/CD y administradores que imprime un reporte del estado de la tabla e interrumpe el flujo (`exit 1`) si la cadena está rota.
