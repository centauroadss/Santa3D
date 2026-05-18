import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pagos = await prisma.pagoMovil.findMany({
      orderBy: { id: 'desc' },
      take: 1,
      include: { inscripcion: true }
    });
    return NextResponse.json({ success: true, data: pagos[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
