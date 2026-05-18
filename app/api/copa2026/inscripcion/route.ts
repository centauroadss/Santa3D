/**
 * POST /api/copa2026/inscripcion
 *
 * Cambios respecto a la versión anterior:
 *   ★ Acepta y persiste `biografia` (≤ 250 chars).
 *   ★ Acepta y persiste `confirmaMayoriaEdad` + calcula `edadAlInscribir`.
 *   ★ Acepta y persiste `concepto` del pago; lo valida contra
 *      nombre+cédula del participante (server-side, no confiar en el cliente).
 *   ★ Validación dura en servidor con los mismos `validators.ts`
 *      que usa el front (defense-in-depth).
 *   ★ Valida monto vía OCR contra `costoUsdPorCategoria * tasaBcvVigente`.
 *
 * Mantiene:
 *   - Prevención de fraude por fileHash.
 *   - Subida a S3.
 *   - Email de bienvenida con tokenVideo.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { validarComprobanteOcr } from '@/lib/copa2026/ocr';
import { StorageService } from '@/lib/storage';
import {
  isValidEmail,
  isValidInstagram,
  validateVenezuelanPhone,
  validateBiografia,
  validateConcepto,
  esMayorDeEdad,
  calculateAge,
  costoUsdPorCategoria,
  BIOGRAFIA_MAX,
} from '@/lib/copa2026/validators';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // ── Extracción ────────────────────────────────────────────────────────
    const nombre = String(formData.get('nombre') ?? '').trim();
    const apellido = String(formData.get('apellido') ?? '').trim();
    const cedulaIdentidad = String(formData.get('cedulaIdentidad') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const telefono = String(formData.get('telefono') ?? '').trim();
    const instagram = String(formData.get('instagram') ?? '').trim();
    const fechaNacimiento = String(formData.get('fechaNacimiento') ?? '');
    const categoria = String(formData.get('categoria') ?? '') as 'RENDER' | 'IA' | 'AMBAS';
    const biografia = String(formData.get('biografia') ?? '').trim();
    const aceptaTerminos = String(formData.get('aceptaTerminos') ?? '') === 'true';
    const cesionDerechos = String(formData.get('cesionDerechos') ?? '') === 'true';
    const confirmaMayoriaEdad =
      String(formData.get('confirmaMayoriaEdad') ?? '') === 'true';
    const bancoOrigenCodigo = String(formData.get('bancoOrigen') ?? '').trim();
    const cedulaPago = String(formData.get('cedulaPago') ?? '').trim();
    const telefonoPago = String(formData.get('telefonoPago') ?? '').trim();
    const referencia = String(formData.get('referencia') ?? '').trim();
    const concepto = String(formData.get('concepto') ?? '').trim();
    const comprobanteFile = formData.get('comprobanteFile') as File | null;
    const fotoPerfilFile = formData.get('fotoPerfilFile') as File | null;

    // ── Validación dura server-side (defense-in-depth) ────────────────────
    const errores: string[] = [];

    if (!nombre || nombre.length < 2) errores.push('nombre');
    if (!apellido || apellido.length < 2) errores.push('apellido');
    if (!/^[VEPvep]-?\d{1,9}$/.test(cedulaIdentidad)) errores.push('cedulaIdentidad');
    if (!isValidEmail(email)) errores.push('email');
    if (!validateVenezuelanPhone(telefono).ok) errores.push('telefono');
    if (!isValidInstagram(instagram)) errores.push('instagram');
    if (!['RENDER', 'IA', 'AMBAS'].includes(categoria)) errores.push('categoria');

    const bio = validateBiografia(biografia);
    if (!bio.ok) errores.push(`biografia (${bio.reason})`);

    if (!aceptaTerminos) errores.push('aceptaTerminos');
    if (!cesionDerechos) errores.push('cesionDerechos');
    if (!confirmaMayoriaEdad) errores.push('confirmaMayoriaEdad');
    if (!esMayorDeEdad(fechaNacimiento)) errores.push('mayoriaEdad');

    if (!validateVenezuelanPhone(telefonoPago).ok) errores.push('telefonoPago');
    if (!bancoOrigenCodigo) errores.push('bancoOrigen');
    if (!cedulaPago) errores.push('cedulaPago');
    if (!referencia || !/^\d{4,}$/.test(referencia)) errores.push('referencia');
    if (!comprobanteFile) errores.push('comprobanteFile');
    if (!fotoPerfilFile) errores.push('fotoPerfilFile');

    // Validación del concepto contra nombre + cédula
    const conceptoCheck = validateConcepto(
      concepto,
      `${nombre} ${apellido}`,
      cedulaIdentidad
    );
    if (!conceptoCheck.ok) errores.push(`concepto (${conceptoCheck.reason})`);

    if (errores.length > 0) {
      return NextResponse.json(
        { error: 'Datos inválidos', campos: errores },
        { status: 400 }
      );
    }

    // ── Prevención de duplicados ──────────────────────────────────────────
    const duplicado = await prisma.inscripcionCopa2026.findFirst({
      where: {
        OR: [{ cedulaIdentidad }, { email }],
      },
    });
    if (duplicado) {
      return NextResponse.json(
        { error: 'Ya existe una inscripción con esa cédula o email' },
        { status: 409 }
      );
    }

    // ── Hash del comprobante para detectar reuso ──────────────────────────
    const bufferComprobante = Buffer.from(await comprobanteFile!.arrayBuffer());
    const fileHash = crypto.createHash('sha256').update(bufferComprobante).digest('hex');

    const pagoExistente = await prisma.pagoMovil.findUnique({ where: { fileHash } });
    if (pagoExistente) {
      return NextResponse.json(
        { error: 'Este comprobante ya fue utilizado en otra inscripción' },
        { status: 400 }
      );
    }

    // ── OCR contra monto esperado ─────────────────────────────────────────
    const costoUsd = costoUsdPorCategoria(categoria);
    const ocrResult = await validarComprobanteOcr(
      bufferComprobante,
      costoUsd,
      referencia,
      nombre,
      apellido,
      cedulaIdentidad,
      { banco: bancoOrigenCodigo, cedula: cedulaPago, telefono: telefonoPago }
    );

    if (!ocrResult.isValid) {
      console.error('[OCR] Falla detallada:', ocrResult.rawJson?.mensaje, ocrResult.rawJson);
      return NextResponse.json(
        {
          error: 'No se pudo validar el comprobante. Verifique que la imagen sea legible y el pago coincida.',
        },
        { status: 400 }
      );
    }

    // ── Subida a S3 ───────────────────────────────────────────────────────
    const bufferFoto = Buffer.from(await fotoPerfilFile!.arrayBuffer());
    const fotoUrl = await StorageService.saveFile(
      bufferFoto,
      `foto-${Date.now()}-${cedulaIdentidad}`,
      fotoPerfilFile!.type
    );
    const comprobanteUrl = await StorageService.saveFile(
      bufferComprobante,
      `comp-${Date.now()}-${cedulaIdentidad}`,
      comprobanteFile!.type
    );

    // ── Token de upload de video ──────────────────────────────────────────
    const tokenVideo = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 días

    // ── Persistencia ──────────────────────────────────────────────────────
    const inscripcion = await prisma.inscripcionCopa2026.create({
      data: {
        nombre,
        apellido,
        cedulaIdentidad,
        email,
        telefono: validateVenezuelanPhone(telefono).normalized!,
        instagram,
        fechaNacimiento: new Date(fechaNacimiento),
        categoria,
        fotoPerfilPath: fotoUrl,
        biografia,
        edadAlInscribir: calculateAge(fechaNacimiento),
        confirmaMayoriaEdad: true,
        aceptaTerminos: true,
        cesionDerechos: true,
        tokenVideo,
        tokenExpiry,
        estatusInscripcion: 'APROBADO',
        estatusToken: 'PENDIENTE',
        pago: {
          create: {
            bancoOrigenCodigo,
            telefonoPago: validateVenezuelanPhone(telefonoPago).normalized!,
            referencia,
            concepto,
            conceptoValidado: conceptoCheck.ok,
            montoCapturadoBs: ocrResult.montoDetectado ?? 0, // Fallback to 0 if null for Prisma's sake, wait, Prisma schema is Decimal (not nullable!)
            montoEsperadoBs: ocrResult.rawJson?.montoEsperadoCalculado ?? 0,
            tasaBcvUsada: ocrResult.rawJson?.tasaUsada ?? 0,
            comprobantePath: comprobanteUrl,
            fileHash,

            // ★ Campos OCR persistidos en columnas dedicadas
            ocrReferenciaDetectada:     ocrResult.referenciaDetectada,
            ocrMontoDetectadoBs:        ocrResult.montoDetectado,
            ocrConceptoExtraido:        ocrResult.conceptoExtraido,
            ocrFechaExtraida:           ocrResult.fechaExtraida ? new Date(ocrResult.fechaExtraida) : null,
            ocrCedulaReceptorDetectada: ocrResult.cedulaReceptorDetectada,
            ocrTelefonoDestinoDetectado:ocrResult.telefonoDestinoDetectado,
            ocrBancoEmisorNombre:       ocrResult.bancoEmisorNombre,
            ocrBancoEmisorCodigo:       ocrResult.bancoEmisorCodigo,
            ocrReferenciaOk:            ocrResult.referenciaOk,
            ocrBancoOk:                 ocrResult.bancoOk,
            ocrCedulaReceptorOk:        ocrResult.cedulaReceptorOk,
            ocrMontoOk:                 ocrResult.montoOk,
            ocrConceptoOk:              ocrResult.conceptoOk,
            ocrConformidadGeneral:      ocrResult.conformidadGeneral,
            ocrVariantUsed:             ocrResult.rawJson?.variantUsed,
            ocrResultadoRaw:            ocrResult.rawJson,
            ocrConfianza:               ocrResult.confidence,
          },
        },
      },
      include: { pago: true },
    });

    // ── Email de bienvenida ───────────────────────────────────────────────
    try {
      const { sendEmailConfirmacion } = await import('@/lib/copa2026/emails/email1-confirmacion');
      await sendEmailConfirmacion({
        nombre: inscripcion.nombre,
        email: inscripcion.email,
        categoria: inscripcion.categoria,
        montoBs: inscripcion.pago?.montoCapturadoBs ?? 0,
        telefonoPago: inscripcion.pago?.telefonoPago ?? '-',
        tokenVideo: inscripcion.tokenVideo,
      });
    } catch (e) {
      console.error('Error enviando email de bienvenida:', e);
    }
    return NextResponse.json({
      success: true,
      inscripcionId: inscripcion.id,
      tokenVideo,
    });
  } catch (e: any) {
    console.error('Inscripción error:', e);
    return NextResponse.json(
      { error: `Error interno procesando la inscripción: ${e?.message || String(e)}` },
      { status: 500 }
    );
  }
}
