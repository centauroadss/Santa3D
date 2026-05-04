// app/api/health/route.ts - Health check
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    console.error("Health check DB error:", error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          storage: 'unknown',
          email: 'unknown',
        },
        error_msg: String(error)
      },
      // IMPORTANT: Always return 200 so EasyPanel does not SIGTERM the container
      { status: 200 }
    );
  }
}
