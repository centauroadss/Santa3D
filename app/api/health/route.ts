// app/api/health/route.ts - Health check
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        storage: 'available',
        email: 'configured',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          storage: 'unknown',
          email: 'unknown',
        },
      },
      { status: 503 }
    );
  }
}
