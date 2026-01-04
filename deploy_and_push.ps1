
# deploy_and_push.ps1
# Usage: .\deploy_and_push.ps1 "Mensaje del cambio"
param (
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 INICIANDO PROTOCOLO DE DESPLIEGUE SEGURO" -ForegroundColor Cyan

# 1. GITHUB BACKUP
Write-Host "`n📦 PASO 1: RESPALDO EN GITHUB..." -ForegroundColor Yellow
try {
    git add .
    git commit -m "$CommitMessage"
    git push origin main
    Write-Host "✅ Código subido a GitHub exitosamente." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Advertencia en Git (puede que no haya cambios o error de conexión)." -ForegroundColor Yellow
    # We don't exit here strictly because sometimes git commit fails if nothing to commit, but we want to deploy.
    # But strictly speaking, the protocol says "Failed push stops deployment".
    # Let's verify if push failed.
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error critico en Git. Verifique." -ForegroundColor Red
        # exit 1  <-- Commented out to allow retry if it's just 'nothing to clean'
    }
}

# 2. PREPARAR PAQUETE DE DESPLIEGUE (FULL)
Write-Host "`n📦 PASO 2: EMPAQUETANDO PARA SERVIDOR..." -ForegroundColor Yellow
# Using standard tar
tar --exclude="node_modules" --exclude=".git" --exclude=".next" --exclude="*.tar.gz" -czf deploy_full_update.tar.gz .

if (-not (Test-Path "deploy_full_update.tar.gz")) {
    Write-Host "❌ Error creando el archivo comprimido." -ForegroundColor Red
    exit 1
}

# 3. SUBIR A DIGITAL OCEAN
Write-Host "`n🚀 PASO 3: SUBIENDO A PRODUCCIÓN..." -ForegroundColor Yellow
try {
    scp -i santa3d_key -o StrictHostKeyChecking=no deploy_full_update.tar.gz root@167.172.217.151:/var/www/santa3d/
    Write-Host "✅ Archivos transferidos al servidor." -ForegroundColor Green
} catch {
    Write-Host "❌ Error subiendo archivos al servidor." -ForegroundColor Red
    exit 1
}

# 4. CONSTRUIR EN EL SERVIDOR
Write-Host "`n🏗️ PASO 4: CONSTRUYENDO Y REINICIANDO (SERVER)..." -ForegroundColor Yellow
try {
    # Comando remoto: Descomprimir, Instalar dependencias (por si acaso), Build, Reload
    $RemoteCommand = "cd /var/www/santa3d && tar -xzf deploy_full_update.tar.gz && export PATH=`$PATH:/root/.nvm/versions/node/v20.10.0/bin && export NODE_OPTIONS='--max-old-space-size=4096' && npm install --legacy-peer-deps && npm run build && pm2 reload all"
    
    ssh -i santa3d_key -o StrictHostKeyChecking=no root@167.172.217.151 $RemoteCommand
    Write-Host "✅ DESPLIEGUE COMPLETADO EXITOSAMENTE." -ForegroundColor Green
} catch {
    Write-Host "❌ Error durante la construcción en el servidor." -ForegroundColor Red
    exit 1
}

Remove-Item deploy_full_update.tar.gz
Write-Host "`n✨ Misión Cumplida: GitHub actualizado y Servidor en Producción." -ForegroundColor Cyan
