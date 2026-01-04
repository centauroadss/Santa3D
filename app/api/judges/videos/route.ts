
// app/api/judges/videos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { getPublicVideoUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (!user || user.role !== 'JUDGE') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'VALIDATED';
    const evaluated = searchParams.get('evaluated');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      status: status as any,
      isJudgeSelected: true,
    };

    if (evaluated === 'false') {
      where.evaluations = { none: { judgeId: user.id } };
    }

    const total = await prisma.video.count({ where });
    const totalJudges = await prisma.judge.count();

    const videos = await prisma.video.findMany({
      where,
      include: {
        participant: { select: { alias: true, instagram: true } },
        _count: { select: { evaluations: true } },
        evaluations: {
          where: { judgeId: user.id },
          select: {
            id: true,
            puntajeTotal: true,
            evaluatedAt: true,
            observacionesGenerales: true,
            criterionScores: { include: { criterion: true } }
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Procesamos videos en paralelo para resolver URLs asíncronas
    const processedVideos = await Promise.all(videos.map(async (v) => {
      let streamUrl = v.url;

      // 1. Resolver URL si falta
      if ((!streamUrl || streamUrl.trim() === '') && v.storageKey) {
        try {
          // Await explícito por si lib/storage es asíncrona en el server
          const resolved = await getPublicVideoUrl(v.storageKey);
          streamUrl = resolved;
        } catch (e) {
          console.error('Error resolving url for', v.id, e);
          streamUrl = '';
        }
      }

      // 2. Fallback final
      if (!streamUrl) streamUrl = '';

      // 3. Parche Drive
      if (streamUrl.includes('drive.google.com') && streamUrl.includes('/file/d/')) {
        const m = streamUrl.match(/\/d\/(.+?)\//);
        if (m && m[1]) streamUrl = `https://drive.google.com/uc?export=download&id=${m[1]}`;
      }

      return {
        id: v.id,
        fileName: v.fileName,
        streamUrl: streamUrl,
        uploadedAt: v.uploadedAt,
        resolution: v.resolution, // New Field
        duration: v.duration,     // New Field
        fps: v.fps,              // New Field
        participant: { alias: v.participant.alias, instagram: v.participant.instagram },
        hasEvaluated: v.evaluations.length > 0,
        evaluation: v.evaluations[0] || null,
        stats: {
          totalVotes: v._count.evaluations,
          pendingVotes: Math.max(0, totalJudges - v._count.evaluations)
        }
      };
    }));

    return NextResponse.json({
      success: true,
      data: {
        videos: processedVideos,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
