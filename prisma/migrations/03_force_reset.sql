-- 🚨 OPCIÓN NUCLEAR: Force Reset BCV 🚨
-- Ejecuta este script desde la consola para resetear la tabla a su estado canónico
-- Este script es transaccional (en MySQL, BEGIN y COMMIT).

BEGIN;

-- 0. Crear tabla si no existe (ya que en producción puede faltar)
CREATE TABLE IF NOT EXISTS tasa_bcv_historico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    fechaValor DATE NOT NULL UNIQUE,
    tasaUsdBs DECIMAL(18, 8) NOT NULL UNIQUE,
    fechaEjecucion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fuenteUrl VARCHAR(255),
    INDEX (fechaValor)
);

-- 1. Limpiar tabla (Borrado completo)
DELETE FROM tasa_bcv_historico;

-- 2. Insertar registros canónicos
INSERT INTO tasa_bcv_historico (fecha, fechaValor, tasaUsdBs, fechaEjecucion, fuenteUrl) VALUES
('2026-04-24', '2026-04-27', 484.7074, NOW(), 'FORCE_RESET'),
('2026-04-27', '2026-04-28', 485.2251, NOW(), 'FORCE_RESET'),
('2026-04-28', '2026-04-29', 486.1955, NOW(), 'FORCE_RESET'),
('2026-04-29', '2026-04-30', 487.1192, NOW(), 'FORCE_RESET'),
('2026-04-30', '2026-05-04', 489.5547, NOW(), 'FORCE_RESET'),
('2026-05-04', '2026-05-05', 490.0442, NOW(), 'FORCE_RESET'),
('2026-05-05', '2026-05-06', 493.3765, NOW(), 'FORCE_RESET'),
('2026-05-06', '2026-05-07', 496.8301, NOW(), 'FORCE_RESET'),
('2026-05-07', '2026-05-08', 499.8608, NOW(), 'FORCE_RESET'),
('2026-05-08', '2026-05-11', 500.4606, NOW(), 'FORCE_RESET'),
('2026-05-11', '2026-05-12', 504.9146, NOW(), 'FORCE_RESET'),
('2026-05-12', '2026-05-13', 508.6004, NOW(), 'FORCE_RESET'),
('2026-05-13', '2026-05-14', 510.7873, NOW(), 'FORCE_RESET'),
('2026-05-14', '2026-05-15', 515.18, NOW(), 'FORCE_RESET');

-- 3. Si todo va bien (no hay duplicados o fallos de constraint) confirmamos.
COMMIT;
