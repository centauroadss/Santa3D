# Estructura del Proyecto Santa 3D (Base para Copa2026)

> [!NOTE]
> El proyecto ha sido extraído exitosamente desde la versión desplegada en EasyPanel (`santa3d_fixed.zip`) y se encuentra disponible localmente en tu equipo.

## Ubicación del Código Fuente
El código completo ha sido descomprimido en la siguiente ruta local:
**`C:\Users\joaou\copa2026\Santa3D_Project`**

## Stack Tecnológico Principal
El proyecto original fue construido utilizando herramientas modernas de desarrollo web, que servirán como una excelente base para el nuevo concurso **Copa2026**:

*   **Framework Frontend:** Next.js (App Router) v14.2
*   **Librería UI:** React v18.3
*   **Estilos:** Tailwind CSS v3.4
*   **Base de Datos / ORM:** Prisma v6.19
*   **Manejo de Estado:** Zustand
*   **Integraciones:** AWS SDK S3 (para manejo de archivos/imágenes), SendGrid & Nodemailer (para correos), Resend.
*   **Validaciones:** Zod & React Hook Form

## Estructura de Directorios

```text
Santa3D_Project/
├── app/                  # Rutas y páginas de la aplicación Next.js (App Router)
├── components/           # Componentes reutilizables de React
├── lib/                  # Utilidades, configuración de base de datos y helpers
├── prisma/               # Esquema de base de datos (schema.prisma) y migraciones
├── public/               # Assets estáticos (imágenes, fuentes, iconos)
├── scripts/              # Scripts de automatización y mantenimiento de la DB
├── .env                  # Archivo de variables de entorno (requiere configuración)
├── next.config.js        # Configuración principal de Next.js
├── package.json          # Dependencias y scripts de ejecución
└── tailwind.config.js    # Configuración de diseño y colores
```

> [!TIP]
> **Recomendaciones para el Equipo Técnico (Copa2026):**
> 1. **Instalación:** Ejecutar `npm install` en la carpeta raíz.
> 2. **Base de Datos:** Revisar el archivo `prisma/schema.prisma` para entender las tablas existentes (Concursantes, Votos, etc.) y adaptarlas al nuevo modelo de datos de la Copa 2026.
> 3. **Variables de Entorno:** Utilizar el archivo `.env` como plantilla para configurar las conexiones a la nueva base de datos, credenciales de AWS S3 y servicios de correo.
> 4. **Limpieza:** Eliminar los scripts de la carpeta raíz (como `deploy_*.sh`, `debug_*.js`) que eran específicos para los despliegues de emergencia de Santa3D y no son necesarios para el nuevo entorno de desarrollo.

## Próximos Pasos
El proyecto ya está listo en tu carpeta `copa2026`. Puedes compartir la carpeta `Santa3D_Project` o este documento con el equipo técnico para que comiencen a trabajar en el nuevo flujo de la competencia.
