-- 1. Corregir el usuario de Instagram en la tabla participants
UPDATE participants 
SET instagram = '@daniels_abrahams' 
WHERE id = (SELECT participantId FROM videos WHERE id = 'cmjoa04k100isjfix6wqsg4d8');

-- 2. Validar el video manualmente y asignar URLs
UPDATE videos 
SET 
    status = 'VALIDATED', 
    validatedAt = NOW(), 
    instagramUrl = 'https://www.instagram.com/reel/DSpwmY9jsKL/',
    url = CONCAT('https://santa3d.sfo3.digitaloceanspaces.com/', storageKey)
WHERE id = 'cmjoa04k100isjfix6wqsg4d8';
