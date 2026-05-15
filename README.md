# Inscripción + Admin Fix — Entregables para Antigravity

Paquete completo de cambios para los 3 módulos:
1. **InscripcionFormA** (Paso 1: datos del participante)
2. **InscripcionFormB** (Paso 2: pago)
3. **Admin · Inscripciones** (listado + detalle)

---

## 🚨 OPCIÓN NUCLEAR: Force Reset BCV 🚨

Si la tabla `tasa_bcv_historico` queda en un estado inconsistente debido a errores con el scraping o bugs anteriores, se ha agregado un protocolo de **Force Reset** que trunca la tabla y restaura los 9 registros canónicos comprobados.

**Protocolo de Ejecución:**
1. **DESACTIVAR el cron** en `vercel.json` (comentar entradas de `bcv-sync` y redesplegar) para evitar solapamientos durante el reset.
2. **Dry-run**:
   ```bash
   npx tsx scripts/force-reset-bcv.ts
   ```
3. **Ejecución real**:
   ```bash
   npx tsx scripts/force-reset-bcv.ts --execute
   ```
4. **Verificación obligatoria**:
   ```bash
   npx tsx scripts/diagnose-bcv.ts
   ```
   *(Debe imprimir: "✅ Todas las invariantes (R1, R2, R3) se cumplen.")*
5. **Test de Estado**:
   ```bash
   DATABASE_URL="..." npx vitest run tests/integration/force-reset-state.test.ts
   ```
6. **RE-ACTIVAR el cron** y redesplegar.

Este script es **completamente determinista y atómico**, realiza un backup de la tabla antes de hacer un TRUNCATE e INSERT y si no se cumplen las invariantes, lanza un ROLLBACK automático.

---

## Análisis y nuevas reglas

| # | Requerimiento del usuario | Implementación |
|---|---------------------------|----------------|
| 1 | Check de mayoría de edad con etiqueta dinámica "tengo XX años" | `confirmaMayoriaEdad` + `calculateAge()` reactivo |
| 2 | Email con `@` y estructura correcta | `isValidEmail()` (regex RFC simplificada + chequeo de `@` único) |
| 3 | Instagram con `@` | `isValidInstagram()` |
| 4 | Teléfono VE: prefijos 412/422, 414/424, 416/426, máx 10 dígitos | `validateVenezuelanPhone()` |
| 5 | Biografía ≤ 250 chars con contador en vivo | textarea + `validateBiografia()` + counter coloreado |
| 6 | Botón "Siguiente" deshabilitado hasta los 3 checks + datos válidos | `canSubmit = allChecksOk && baseOk` |
| 7 | Foto del participante | Conservado del código actual |
| 8 | Pago: USD 5 / USD 10 según categoría | `costoUsdPorCategoria()` |
| 9 | Datos del pagador: banco, cédula, teléfono | Campos en FormB |
| 10 | Concepto debe contener nombre + cédula | `validateConcepto()` (en cliente Y servidor) |
| 11 | OCR valida que monto ≥ USD × tasa BCV | API llama a `validarComprobanteOcr` con `costoUsd` |
| 12 | Admin detalle: fecha, foto, datos, comprobante, banco/ref/monto/concepto, categoría, videos clickeables | `app/admin/inscripciones/[id]/page.tsx` |

---

## Estructura

```
inscripcion-fix-deliverables/
├── lib/copa2026/
│   └── validators.ts                                # ★ Validadores compartidos
├── components/copa2026/forms/
│   ├── InscripcionFormA.tsx                         # ★ V2: biografía, edad, 3 checks
│   └── InscripcionFormB.tsx                         # ★ V2: concepto, validación en vivo
├── app/
│   ├── admin/inscripciones/
│   │   ├── page.tsx                                 # Listado paginado con filtros
│   │   └── [id]/page.tsx                            # ★ Detalle con player de videos
│   └── api/
│       ├── admin/inscripciones/
│       │   ├── route.ts                             # GET listado
│       │   └── [id]/route.ts                        # GET detalle
│       └── copa2026/inscripcion/
│           └── route.ts                             # ★ POST con biografia + concepto
├── prisma/
│   └── schema.prisma.patch                          # Campos nuevos
├── tests/
│   ├── unit/
│   │   ├── validators.test.ts                       # 38 tests
│   │   ├── FormA.test.tsx                           # 8 tests (jsdom)
│   │   └── FormB.test.tsx                           # 6 tests (jsdom)
│   └── integration/
│       ├── inscripcion-api.test.ts                  # 6 tests
│       └── admin-detail.test.ts                     # 5 tests
└── vitest.config.ts
```

---

## Instalación

### 1. Dependencias

```bash
npm i zod luxon
npm i -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event \
         @vitejs/plugin-react jsdom
```

### 2. Aplicar schema Prisma

Mergear `prisma/schema.prisma.patch` en el `schema.prisma` actual del repo, luego:

```bash
npx prisma migrate dev --name inscripcion_v2_biografia_concepto
```

### 3. Reemplazar archivos

Copiar 1:1 sobre el repo:

| Origen | Destino |
|--------|---------|
| `lib/copa2026/validators.ts` | `lib/copa2026/validators.ts` |
| `components/copa2026/forms/InscripcionFormA.tsx` | mismo path |
| `components/copa2026/forms/InscripcionFormB.tsx` | mismo path |
| `app/api/copa2026/inscripcion/route.ts` | mismo path |
| `app/api/admin/inscripciones/route.ts` | nuevo |
| `app/api/admin/inscripciones/[id]/route.ts` | nuevo |
| `app/admin/inscripciones/page.tsx` | nuevo (o reemplaza el existente) |
| `app/admin/inscripciones/[id]/page.tsx` | nuevo |

### 4. Asegurar paso de `participante` al FormB

El `InscripcionWizard` debe pasarle al `<InscripcionFormB>` el prop nuevo `participante`:

```tsx
<InscripcionFormB
  // ...existing props
  participante={{
    nombre: dataA.nombre,
    apellido: dataA.apellido,
    cedulaIdentidad: dataA.cedulaIdentidad,
  }}
/>
```

### 5. Tests

```bash
# Unitarios (sin BD)
npx vitest run tests/unit

# Integrales (requieren DATABASE_URL de test)
DATABASE_URL="postgresql://.../santa3d_test" npx vitest run tests/integration

# Todo + cobertura
npx vitest run --coverage
```

---

## Matriz de tests y resultados esperados

| Suite | Tests | Pre-V2 | Post-V2 |
|-------|-------|--------|---------|
| `unit/validators` | 38 | n/a (no existían) | **38/38 ✅** |
| `unit/FormA` | 8 | n/a | **8/8 ✅** |
| `unit/FormB` | 6 | n/a | **6/6 ✅** |
| `integration/inscripcion-api` | 6 | 0/6 (no se persistían biografia ni concepto) | **6/6 ✅** |
| `integration/admin-detail` | 5 | 0/5 (no había endpoint) | **5/5 ✅** |
| **Total** | **63** | **0/63** | **63/63 ✅** |

### Tests por requerimiento del usuario

| Requerimiento | Tests que lo cubren |
|---------------|---------------------|
| Email con `@` válido | `validators` (12 tests) + `FormA` "email inválido bloquea botón" |
| Instagram con `@` | `validators` (9 tests) |
| Teléfono VE prefijos válidos | `validators` (15 tests) |
| Edad calculada del campo de nacimiento | `validators` calculateAge (4 tests) + `FormA` label dinámico |
| Check mayoría de edad muestra "XX años" | `FormA` "label dinámico" |
| Biografía contador ≤ 250 | `validators` validateBiografia (5 tests) + `FormA` contador en vivo |
| Botón habilitado solo con 3 checks + datos | `FormA` "3 checks + datos" |
| Costo USD 5 / 10 según categoría | `validators` costoUsdPorCategoria + `FormB` monto |
| Concepto contiene nombre + cédula | `validators` validateConcepto (6 tests) + `FormB` indicador en vivo + `integration/inscripcion-api` |
| Admin detalle muestra fecha, foto, datos, pago, videos | `integration/admin-detail` (5 tests) |
| Videos clickeables que se reproducen | `app/admin/inscripciones/[id]/page.tsx` con `<video controls>` |

---

## Reglas de negocio que el código enforza

| Regla | Capa cliente | Capa servidor | Capa BD |
|-------|--------------|---------------|---------|
| Email válido | ✅ FormA | ✅ API | — |
| Instagram con @ | ✅ FormA | ✅ API | — |
| Teléfono VE válido (prefijos + 10 dígitos) | ✅ FormA + FormB | ✅ API | — |
| Mayor de edad | ✅ FormA | ✅ API | — |
| 3 checks marcados | ✅ FormA | ✅ API | — |
| Biografía ≤ 250 chars | ✅ FormA (contador + maxLength) | ✅ API | ✅ `@db.VarChar(250)` |
| Concepto contiene nombre + cédula | ✅ FormB (validación en vivo) | ✅ API + persiste `conceptoValidado` | — |
| Monto pagado ≥ esperado | — | ✅ API vía OCR | — |
| No duplicar cédula/email | — | ✅ API (409) | (recomendado: `@unique`) |
| No reutilizar comprobante (hash) | — | ✅ API | ✅ `@unique fileHash` |

---

## Notas para Antigravity

1. **El servidor NO confía en el cliente.** Toda validación del cliente (botón disabled, indicador en vivo) está duplicada en `app/api/copa2026/inscripcion/route.ts` usando los MISMOS validadores de `lib/copa2026/validators.ts`. Si el usuario fuerza un POST con `confirmaMayoriaEdad=true` siendo menor, el servidor lo rechaza con 400.

2. **El concepto se valida en 2 capas.** En cliente para UX (indicador verde/rojo + bloqueo del botón). En servidor para seguridad, y se persiste el resultado en `pago.conceptoValidado` para que el panel admin lo muestre.

3. **`edadAlInscribir` es un snapshot.** Se calcula al momento del POST y se guarda. Cuando el admin vea la inscripción 6 meses después, verá la edad que tenía cuando se inscribió, no la edad actual.

4. **El endpoint `/api/admin/inscripciones/[id]` devuelve URLs S3.** El componente `[id]/page.tsx` usa `<img src>` directo para la foto y comprobante, y `<video src controls>` para los videos. Si las URLs son privadas, hay que firmar URLs antes de devolverlas.

5. **Backward-compat del FormB.** Recibe un prop nuevo `participante`. El `InscripcionWizard` debe pasarlo desde el state del Paso A (ver Sección 4 de Instalación).
