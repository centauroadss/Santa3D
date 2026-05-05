import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as z from 'zod';
import { extractMontoFromCapture } from '@/lib/copa2026/ocr';
import { sendEmailConfirmacion } from '@/lib/copa2026/emails/email1-confirmacion';

const prisma = new PrismaClient();

const s3Client = new S3Client({
    endpoint: 'https://nyc3.digitaloceanspaces.com', // DO Spaces endpoint
    region: 'us-east-1', // DO uses us-east-1 for compatibility
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
    }
});

const payloadSchema = z.object({
    nombre: z.string(),
    apellido: z.string(),
    cedulaIdentidad: z.string(),
    email: z.string().email(),
    telefono: z.string(),
    instagram: z.string(),
    categoria: z.enum(['RENDER', 'IA', 'AMBAS']),
    telefonoPago: z.string(),
    cedulaPago: z.string(),
    bancoPagoCodigo: z.string(),
    montoDeclaradoBs: z.string(),
    comprobanteBase64: z.string(),
    tasaBcv: z.number(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = payloadSchema.parse(body);

        // 1. Validar unicidad (Email + Categoría y Cédula + Categoría)
        const existeInscripcion = await prisma.inscripcionCopa2026.findFirst({
            where: {
                OR: [
                    { email: data.email, categoria: data.categoria },
                    { cedulaIdentidad: data.cedulaIdentidad, categoria: data.categoria }
                ]
            }
        });

        if (existeInscripcion) {
            return NextResponse.json({ error: 'Ya existe una inscripción con este email o cédula en esta categoría.' }, { status: 409 });
        }

        // 2. Extraer MIME type y data limpia del base64
        const matches = data.comprobanteBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json({ error: 'Formato de imagen inválido' }, { status: 400 });
        }
        const mimeType = matches[1];
        const base64Data = matches[2];

        // 3. Subir a DigitalOcean Spaces
        const bucket = process.env.DO_SPACES_BUCKET_COMPROBANTES || 'copa2026-comprobantes';
        const fileExtension = mimeType.split('/')[1] || 'jpg';
        const fileName = `comprobantes/${Date.now()}_${uuidv4()}.${fileExtension}`;
        const buffer = Buffer.from(base64Data, 'base64');

        await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: fileName,
            Body: buffer,
            ACL: 'private',
            ContentType: mimeType,
        }));

        const s3Path = `s3://${bucket}/${fileName}`;

        const montoUsd = data.categoria === 'AMBAS' ? 20 : 10;
        const montoEsperado = data.tasaBcv * montoUsd;

        // 4. OCR y Validación de Monto
        let montoOcr = 0;
        try {
            montoOcr = await extractMontoFromCapture(base64Data, mimeType as any, montoEsperado);
        } catch (error: any) {
            return NextResponse.json({ error: 'No se pudo extraer el monto del comprobante: ' + error.message }, { status: 422 });
        }
        
        // Tolerancia de 0.50 Bs
        if (montoOcr < (montoEsperado - 0.50)) {
            return NextResponse.json({ 
                error: `El monto del comprobante (Bs. ${montoOcr}) es menor al monto requerido (Bs. ${montoEsperado.toFixed(2)}).` 
            }, { status: 400 });
        }

        // 5. Crear Inscripción y PagoMovil
        // Expiry Date: 2026-06-05T23:59:00-04:00 (VET)
        const expiryDate = new Date('2026-06-06T03:59:00.000Z'); // UTC equivalent
        const tokenVideo = uuidv4();

        const inscripcion = await prisma.inscripcionCopa2026.create({
            data: {
                nombre: data.nombre,
                apellido: data.apellido,
                cedulaIdentidad: data.cedulaIdentidad,
                email: data.email,
                telefono: data.telefono,
                instagram: data.instagram,
                categoria: data.categoria,
                tokenVideo: tokenVideo,
                tokenExpiry: expiryDate,
                estatusInscripcion: 'APROBADO',
                pago: {
                    create: {
                        bancoOrigenCodigo: data.bancoPagoCodigo,
                        telefonoPago: data.telefonoPago,
                        referencia: 'Generada', // To be filled/extracted if needed later
                        montoCapturadoBs: montoOcr,
                        montoEsperadoBs: montoEsperado,
                        tasaBcvUsada: data.tasaBcv,
                        comprobantePath: s3Path,
                        estatusPago: 'VALIDADO',
                        ocrConfianza: 1.0,
                    }
                }
            }
        });

        // 6. Enviar Email de Confirmación
        try {
            await sendEmailConfirmacion({
                nombre: data.nombre,
                email: data.email,
                categoria: data.categoria,
                montoBs: montoOcr,
                telefonoPago: data.telefonoPago,
                tokenVideo: tokenVideo
            });
        } catch (emailError) {
            console.error('Error enviando email de confirmación:', emailError);
            // We don't fail the registration if email fails, but we log it.
        }

        return NextResponse.json({ success: true, message: 'Inscripción confirmada' });

    } catch (error: any) {
        console.error('Error en endpoint inscripcion:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
