-- =============================================================
-- Pre-migración: verifica que no haya duplicados antes de aplicar
-- UNIQUE en fechaValor y tasaUsdBs.
-- Si alguna query devuelve filas, consolidar manualmente antes
-- de correr `prisma migrate dev`.
-- =============================================================

\echo '>>> Duplicados en fecha_valor:'
SELECT fecha_valor, COUNT(*) AS n, array_agg(id ORDER BY id) AS ids
FROM tasa_bcv_historico
GROUP BY fecha_valor
HAVING COUNT(*) > 1;

\echo ''
\echo '>>> Duplicados en tasa_usd_bs:'
SELECT tasa_usd_bs, COUNT(*) AS n, array_agg(id ORDER BY id) AS ids
FROM tasa_bcv_historico
GROUP BY tasa_usd_bs
HAVING COUNT(*) > 1;

\echo ''
\echo '>>> Duplicados en fecha:'
SELECT fecha, COUNT(*) AS n, array_agg(id ORDER BY id) AS ids
FROM tasa_bcv_historico
GROUP BY fecha
HAVING COUNT(*) > 1;

\echo ''
\echo '>>> Cadena FV_prev = fecha_next (filas violatorias):'
WITH ordenado AS (
  SELECT
    id, fecha, fecha_valor,
    LAG(fecha_valor) OVER (ORDER BY fecha) AS fv_prev,
    LAG(fecha)       OVER (ORDER BY fecha) AS fecha_prev
  FROM tasa_bcv_historico
)
SELECT id, fecha_prev, fv_prev, fecha,
       (fv_prev <> fecha) AS cadena_rota
FROM ordenado
WHERE fv_prev IS NOT NULL AND fv_prev <> fecha;
