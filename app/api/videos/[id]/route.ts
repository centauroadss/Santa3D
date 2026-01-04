import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { getPublicVideoUrl } from '@/lib/storage';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    
    // Solo Admin o Jueces pueden ver detalles de videos específicos
    if (!user || (user.role !== 'ADMIN' && user.role !== 'JUDGE')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        participant: true,
        evaluations: true
      }
    });
    if (!video) {
      return NextResponse.json({ success: false, error: 'Video no encontrado' }, { status: 404 });
    }
    // Generar URL pública para streaming (Manejo seguro de nulos)
    const streamUrl = getPublicVideoUrl(video.storageKey || '');
    return NextResponse.json({
      success: true,
      data: {
        ...video,
        streamUrl
      }
    });
  } catch (error: any) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
