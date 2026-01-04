// app/api/contest/settings/route.ts - Configuración pública del concurso
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Obtener todas las configuraciones
    const settings = await prisma.contestSetting.findMany();
    
    // Convertir a objeto clave-valor
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    // Verificar si el concurso está abierto
    const submissionDeadline = settingsMap.submission_deadline 
      ? new Date(settingsMap.submission_deadline)
      : new Date();
    const isOpen = new Date() < submissionDeadline;

    return NextResponse.json({
      success: true,
      data: {
        contestName: settingsMap.contest_name || 'Concurso Santa 3D Venezolano',
        submissionDeadline: submissionDeadline.toISOString(),
        winnerAnnouncement: settingsMap.winner_announcement || null,
        isOpen,
        technicalSpecs: {
          videoFormat: ['MP4', 'MOV'],
          videoResolution: '1024x1792',
          videoDuration: '15-20 segundos',
          videoFrameRate: '30fps',
          videoCodec: ['H.264', 'ProRes'],
          maxFileSize: 524288000, // 500MB en bytes
        },
        prize: {
          amount: settingsMap.prize_amount || '$600 USD',
          projection: settingsMap.prize_description || 'Pantalla outdoor 10 metros - Chacao, Caracas',
        },
        requirements: {
          minAge: 18,
          location: 'Venezuela',
          mustFollow: '@centauroads',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching contest settings:', error);

    return NextResponse.json(
      { success: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}
