#!/bin/bash
# Descomprimir el hotfix en el servidor
tar -xzf deploy_email_final_fix.tar.gz -C /var/www/santa3d
# Reiniciar PM2 para asegurar que tome los cambios
pm2 reload santa3d-api || pm2 reload all
echo "✅ Despliegue completado. El email ha sido actualizado."
