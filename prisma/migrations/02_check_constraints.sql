-- Migración manual para aplicar la restricción R1 (fechaValor > fecha)
-- Esto protege a la base de datos contra inserciones erróneas incluso si se bypassea Prisma.

ALTER TABLE `tasa_bcv_historico` 
ADD CONSTRAINT `check_fv_gt_fecha` 
CHECK (`fechaValor` > `fecha`);
