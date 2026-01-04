// app/api/admin/stats/route.ts - Estadísticas del concurso
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { getTimeRemaining } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    // Autenticar admin
    const user = await authenticateRequest(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Estadísticas de participantes
    const totalParticipants = await prisma.participant.count();
    const participantsWithVideo = await prisma.participant.count({
      where: {
        video: {
          isNot: null,
        },
      },
    });
    const participantsWithoutVideo = totalParticipants - participantsWithVideo;

    // Estadísticas de videos
    const totalVideos = await prisma.video.count();
    const videosValidated = await prisma.video.count({
      where: { status: 'VALIDATED' },
    });
    const videosRejected = await prisma.video.count({
      where: { status: 'REJECTED' },
    });
    const videosPending = await prisma.video.count({
      where: { status: { in: ['PENDING_UPLOAD', 'PENDING_VALIDATION'] } },
    });

    // Estadísticas de evaluaciones
    const totalJudges = await prisma.judge.count();
    const totalPossibleEvaluations = videosValidated * totalJudges;
    const totalEvaluations = await prisma.evaluation.count();
    const pendingEvaluations = totalPossibleEvaluations - totalEvaluations;
    const percentageComplete = totalPossibleEvaluations > 0
      ? Math.round((totalEvaluations / totalPossibleEvaluations) * 100 * 10) / 10
      : 0;

    // Timeline del concurso
    const submissionDeadline = await prisma.contestSetting.findUnique({
      where: { key: 'submission_deadline' },
    });

    const deadline = submissionDeadline ? new Date(submissionDeadline.value) : new Date();
    const timeRemaining = getTimeRemaining(deadline);

    return NextResponse.json({
      success: true,
      data: {
        participants: {
          total: totalParticipants,
          withVideo: participantsWithVideo,
          withoutVideo: participantsWithoutVideo,
        },
        videos: {
          total: totalVideos,
          validated: videosValidated,
          rejected: videosRejected,
          pending: videosPending,
        },
        evaluations: {
          total: totalEvaluations,
          totalPossible: totalPossibleEvaluations,
          completed: totalEvaluations,
          pending: pendingEvaluations,
          percentageComplete,
        },
        timeline: {
          contestStart: '2024-12-22T00:00:00Z',
          submissionDeadline: deadline.toISOString(),
          currentTime: new Date().toISOString(),
          timeRemaining: {
            days: timeRemaining.days,
            hours: timeRemaining.hours,
            minutes: timeRemaining.minutes,
          },
          hoursRemaining: Math.round((timeRemaining.total / (1000 * 60 * 60)) * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);

    return NextResponse.json(
      { success: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
