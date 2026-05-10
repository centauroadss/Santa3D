import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validarComprobanteOcr } from '@/lib/copa2026/ocr';
import { validateProfilePhoto } from '@/lib/copa2026/faceValidation';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock');
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock',
  }
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const nombre = formData.get('nombre') as string;
    const apellido = formData.get('apellido') as string;
    const cedulaIdentidad = formData.get('cedulaIdentidad') as string;
    const email = formData.get('email') as string;
    const telefono = formData.get('telefono') as string;
    const instagram = formData.get('instagram') as string;
    const fechaNacimientoStr = formData.get('fechaNacimiento') as string;
    const categoria = formData.get('categoria') as 'RENDER' | 'IA' | 'AMBAS';
    
    let fechaNacimiento: Date | null = null;
    let edad: number = 0;
    if (fechaNacimientoStr) {
      fechaNacimiento = new Date(fechaNacimientoStr);
      edad = Math.floor((new Date().getTime() - fechaNacimiento.getTime()) / 31557600000);
    }
    
    const fotoPerfilFile = formData.get('fotoPerfilFile') as File;
    const telefonoPago = formData.get('telefonoPago') as string;
    const cedulaPago = formData.get('cedulaPago') as string;
    const bancoOrigen = formData.get('bancoOrigen') as string;
    const referencia = formData.get('referencia') as string;
    const comprobanteFile = formData.get('comprobanteFile') as File;

    if (!comprobanteFile) {
      return NextResponse.json({ error: 'Falta el comprobante de pago.' }, { status: 400 });
    }
    
    if (!fotoPerfilFile) {
      return NextResponse.json({ error: 'Falta la foto de perfil.' }, { status: 400 });
    }

    // Hash comprobante y validación de duplicados
    const arrayBufferComprobante = await comprobanteFile.arrayBuffer();
    const bufferComprobante = Buffer.from(arrayBufferComprobante);
    const fileHash = crypto.createHash('sha256').update(bufferComprobante).digest('hex');

    const pagoExistenteHash = await prisma.pagoMovil.findUnique({
      where: { fileHash }
    });

    const pagoExistenteDatos = await prisma.pagoMovil.findFirst({
      where: {
        bancoOrigenCodigo: bancoOrigen,
        telefonoPago: telefonoPago,
        referencia: referencia
      }
    });

    if (pagoExistenteHash || pagoExistenteDatos) {
      return NextResponse.json({ 
        error: 'Este comprobante de pago o esta transacción ya fue utilizada en otra inscripción. Intento de fraude detectado.' 
      }, { status: 400 });
    }

    // Validación de Foto Perfil
    const arrayBufferFoto = await fotoPerfilFile.arrayBuffer();
    const bufferFoto = Buffer.from(arrayBufferFoto);
    const base64Foto = bufferFoto.toString('base64');
    
    const faceValidation = await validateProfilePhoto(base64Foto);
    if (!faceValidation.isValid) {
      return NextResponse.json({ 
        error: `La foto de perfil no es válida: ${faceValidation.reason || 'Debe ser un rostro humano claro y de una sola persona.'}` 
      }, { status: 400 });
    }

    // Obtener costos de DB
    const configs = await prisma.configConcurso.findMany({
      where: {
        clave: { in: ['costo_una_categoria', 'costo_ambas_categorias'] }
      }
    });
    const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);
    const costoUnaCategoria = parseFloat(configMap['costo_una_categoria'] || '5');
    const costoAmbasCategorias = parseFloat(configMap['costo_ambas_categorias'] || '10');

    // Calcular monto esperado
    const bcvRecord = await prisma.tasaBcvHistorico.findFirst({ orderBy: { fecha: 'desc' } });
    const tasaBcv = bcvRecord ? parseFloat(bcvRecord.tasaUsdBs.toString()) : 55.45;
    const montoUsd = categoria === 'AMBAS' ? costoAmbasCategorias : costoUnaCategoria;
    const montoEsperadoBs = tasaBcv * montoUsd;

    const base64Image = bufferComprobante.toString('base64');

    // 1. OCR Validación
    const ocrResult = await validarComprobanteOcr(base64Image, montoEsperadoBs, referencia, nombre, apellido, cedulaIdentidad);
    
    // Si OCR falla por monto u otro motivo
    if (!ocrResult.isValid) {
      return NextResponse.json({ 
        error: `Error de Validación: ${ocrResult.rawJson?.error || `El OCR no pudo validar el monto de ${montoEsperadoBs.toFixed(2)} Bs o el concepto en la imagen.`} Por favor, verifica y vuelve a intentarlo.`
      }, { status: 400 });
    }
    
    // Aquí implementamos la evaluación blanda del Concepto
    // No bloqueamos, pero se podría registrar un warning si es necesario. (OCR extrae rawJson)

    // 2. Subir imágenes a S3
    const compExt = comprobanteFile.name.split('.').pop();
    const fileNameComprobante = `pagos_2026/${Date.now()}-${uuidv4()}.${compExt}`;
    
    const fotoExt = fotoPerfilFile.name.split('.').pop();
    const fileNameFoto = `perfiles_2026/${Date.now()}-${uuidv4()}.${fotoExt}`;
    
    let savedComprobantePath = fileNameComprobante;
    let savedFotoPath = fileNameFoto;
    
    try {
      savedComprobantePath = await StorageService.saveFile(bufferComprobante, fileNameComprobante, comprobanteFile.type);
      savedFotoPath = await StorageService.saveFile(bufferFoto, fileNameFoto, fotoPerfilFile.type);
    } catch (e) {
      console.error("Error al guardar imágenes en StorageService, usando paths por defecto:", e);
    }

    // 3. Crear Inscripción en BD
    const tokenVideo = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 30); // 30 días de validez

    const inscripcion = await prisma.inscripcionCopa2026.create({
      data: {
        cedulaIdentidad,
        nombre,
        apellido,
        telefono,
        email,
        instagram,
        fechaNacimiento,
        edad,
        categoria,
        tokenVideo,
        tokenExpiry,
        fotoPerfilPath: savedFotoPath,
        estatusInscripcion: 'APROBADO', // Se aprueba automático por el OCR
        pago: {
          create: {
            bancoOrigenCodigo: bancoOrigen,
            telefonoPago,
            referencia,
            montoCapturadoBs: ocrResult.montoDetectado || montoEsperadoBs,
            montoEsperadoBs,
            tasaBcvUsada: tasaBcv,
            comprobantePath: savedComprobantePath,
            fileHash,
            ocrResultadoRaw: ocrResult.rawJson,
            ocrConfianza: ocrResult.confidence,
            estatusPago: 'VALIDADO'
          }
        }
      }
    });

    // 4. Enviar Email
    const uploadLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://copa2026.centauroads.com'}/copa2026/upload/${tokenVideo}`;
    
    let emailSubject = '¡Bienvenido a Copa 2026! Tu inscripción fue exitosa';
    let emailHtml = `
      <h1>¡Hola ${nombre}!</h1>
      <p>Tu inscripción a la categoría ${categoria} ha sido recibida y tu pago validado correctamente.</p>
      <p>Para subir tu(s) video(s), utiliza el siguiente enlace privado:</p>
      <a href="${uploadLink}">${uploadLink}</a>
      <p>Recuerda que el video debe tener una resolución de 1024x2048 y duración máxima de 30s.</p>
    `;

    // Intentar buscar plantilla en BD
    try {
      const template = await prisma.plantillaEmail.findUnique({ where: { tipo: 'BIENVENIDA' } });
      if (template) {
        emailSubject = template.asunto;
        emailHtml = template.contenidoHtml
          .replace('{{nombre}}', nombre)
          .replace('{{categoria}}', categoria)
          .replace('{{token_link}}', uploadLink);
      }
    } catch (e) {
      console.error("No se pudo cargar la plantilla de la BD", e);
    }

    let bccEmails = ['mercadeo@centauroads.com'];
    try {
      const bccConfig = await prisma.configConcurso.findUnique({ where: { clave: 'emails_bcc_general' } });
      if (bccConfig && bccConfig.valor) {
        bccEmails = bccConfig.valor.split(',').map(e => e.trim()).filter(e => e);
      }
    } catch(e) {}

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Copa 2026 <no-reply@centauroads.com>',
        to: email,
        bcc: bccEmails,
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `pago_${referencia}.${compExt}`,
            content: bufferComprobante
          }
        ]
      });
    }

    return NextResponse.json({ success: true, inscripcionId: inscripcion.id });

  } catch (error: any) {
    console.error('Error en endpoint inscripcion:', error);
    // Si hay error de constraint único
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una inscripción con esta cédula/email para esta categoría.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno procesando la inscripción.' }, { status: 500 });
  }
}
