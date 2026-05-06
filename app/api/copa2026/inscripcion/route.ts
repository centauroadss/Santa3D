import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validarComprobanteOcr } from '@/lib/copa2026/ocr';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
    const categoria = formData.get('categoria') as 'RENDER' | 'IA' | 'AMBAS';
    
    const telefonoPago = formData.get('telefonoPago') as string;
    const cedulaPago = formData.get('cedulaPago') as string;
    const bancoOrigen = formData.get('bancoOrigen') as string;
    const referencia = formData.get('referencia') as string;
    const comprobanteFile = formData.get('comprobanteFile') as File;

    if (!comprobanteFile) {
      return NextResponse.json({ error: 'Falta el comprobante de pago.' }, { status: 400 });
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

    // Convertir file a base64 para OCR
    const arrayBuffer = await comprobanteFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // 1. OCR Validación
    const ocrResult = await validarComprobanteOcr(base64Image, montoEsperadoBs, referencia);
    
    if (!ocrResult.isValid) {
      return NextResponse.json({ 
        error: `El OCR no pudo validar el monto de ${montoEsperadoBs.toFixed(2)} Bs en la imagen. Por favor sube un comprobante más claro.`
      }, { status: 400 });
    }

    // 2. Subir imagen a S3 (simulado si no hay keys)
    const fileExt = comprobanteFile.name.split('.').pop();
    const fileName = `pagos_2026/${Date.now()}-${uuidv4()}.${fileExt}`;
    
    if (process.env.AWS_ACCESS_KEY_ID) {
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: comprobanteFile.type,
      }));
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
        categoria,
        tokenVideo,
        tokenExpiry,
        estatusInscripcion: 'APROBADO', // Se aprueba automático por el OCR
        pago: {
          create: {
            bancoOrigenCodigo: bancoOrigen,
            telefonoPago,
            referencia,
            montoCapturadoBs: ocrResult.montoDetectado || montoEsperadoBs,
            montoEsperadoBs,
            tasaBcvUsada: tasaBcv,
            comprobantePath: fileName,
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

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Copa 2026 <no-reply@centauroads.com>',
        to: email,
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `pago_${referencia}.${fileExt}`,
            content: buffer
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
