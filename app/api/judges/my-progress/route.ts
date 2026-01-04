import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'JUDGE') {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const totalVideos = await prisma.video.count({
      where: { status: 'VALIDATED', isJudgeSelected: true },
    });
    const videosEvaluated = await prisma.evaluation.count({ where: { judgeId: user.id } });
    const lastEvaluation = await prisma.evaluation.findFirst({
      where: { judgeId: user.id },
      orderBy: { evaluatedAt: 'desc' },
      select: { evaluatedAt: true },
    });
    return NextResponse.json({
      success: true,
      data: {
        totalVideos,
        videosEvaluated,
        videosPending: Math.max(0, totalVideos - videosEvaluated),
        percentageComplete: totalVideos > 0 ? Math.round((videosEvaluated / totalVideos) * 100) : 0,
        lastEvaluationAt: lastEvaluation?.evaluatedAt || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
