import { NextResponse } from 'next/server';
import { syncBcv } from '@/lib/copa2026/bcv-sync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Simple protection so not anyone can trigger it randomly, though it's idempotent
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'copa2026-cron'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[BCV API] Ejecutando syncBcv() en el cron...');
    const result = await syncBcv();
    
    return NextResponse.json({
      success: true,
      data: result,
      message: result.nuevo ? 'Nueva tasa insertada' : 'Tasa actualizada/verificada'
    });
  } catch (error: any) {
    console.error('[BCV API] Error en cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
