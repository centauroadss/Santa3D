import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { participantRegistrationSchema } from '@/lib/validations';
import { calculateAge } from '@/lib/utils';
import { sendRegistrationEmail } from '@/lib/email';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validar datos
    const validatedData = participantRegistrationSchema.parse(body);
    // Verificar si el email ya está registrado
    const existingParticipant = await prisma.participant.findUnique({
      where: { email: validatedData.email },
      include: { video: true },
    });
    if (existingParticipant) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'Este email ya está registrado.',
        },
        { status: 409 }
      );
    }
    // Calcular edad
    const birthDate = new Date(validatedData.fechaNacimiento);
    const edad = calculateAge(birthDate);
    // Crear participante
    const participant = await prisma.participant.create({
      data: {
        ...validatedData,
        fechaNacimiento: birthDate,
        edad: edad,
        alias: validatedData.alias ?? '',
      },
    });
    // Enviar email de confirmación (No bloqueante)
    try {
      await sendRegistrationEmail(participant.email, participant.nombre);
    } catch (emailError) {
      console.warn('⚠️ Advertencia: Participante creado pero falló el email de bienvenida:', emailError);
      // Continuamos sin lanzar error
    }
    return NextResponse.json(
      {
        success: true,
        data: {
          participantId: participant.id,
          nombre: participant.nombre,
          apellido: participant.apellido,
          instagram: participant.instagram,
          email: participant.email,
          requirementsForUpload: {
            videoFormat: ['MP4', 'MOV'],
            videoResolution: '1024x1792',
            videoDuration: '15-20 segundos',
            videoFrameRate: '30fps',
            videoCodec: ['H.264', 'ProRes'],
            maxFileSize: '500MB',
          },
        },
        message: 'Registro exitoso. Verifica tu email para continuar con la subida del video.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error registering participant:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error al registrar participante',
      },
      { status: 500 }
    );
  }
}
