import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { getPublicVideoUrl } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const minEvaluations = parseInt(searchParams.get('minEvaluations') || '3');
    const limit = parseInt(searchParams.get('limit') || '100');
    const videos = await prisma.video.findMany({
      where: {
        status: 'VALIDATED',
        evaluations: { some: {} },
      },
      include: {
        participant: { select: { id: true, nombre: true, apellido: true, alias: true, instagram: true, fechaNacimiento: true } },
        evaluations: { include: { judge: { select: { nombre: true } }, criterionScores: { include: { criterion: true } } } },
      },
    });
    const rankings = videos
      .map(video => {
        const evaluationCount = video.evaluations.length;
        if (evaluationCount < minEvaluations) return null;
        const totalScores = video.evaluations.map(e => e.puntajeTotal);
        const averageScore = totalScores.reduce((sum, score) => sum + score, 0) / evaluationCount;
        const criteriaMap = new Map();
        video.evaluations.forEach(evaluation => {
          evaluation.criterionScores.forEach(score => {
            if (!criteriaMap.has(score.criterionId)) {
              criteriaMap.set(score.criterionId, { name: score.criterion.nombre, scores: [], weight: score.criterion.peso });
            }
            criteriaMap.get(score.criterionId).scores.push(score.puntaje);
          });
        });
        const breakdown = Array.from(criteriaMap.entries()).map(([id, data]: any) => ({
          criterionId: id,
          criterionName: data.name,
          averageScore: Math.round((data.scores.reduce((sum: number, s: number) => sum + s, 0) / data.scores.length) * 10) / 10,
          weight: data.weight,
        }));
        const birthDate = new Date(video.participant.fechaNacimiento);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        const edad = Math.abs(ageDate.getUTCFullYear() - 1970);
        return {
          participant: {
            id: video.participant.id,
            nombreCompleto: `${video.participant.nombre} ${video.participant.apellido}`,
            alias: video.participant.alias,
            instagram: video.participant.instagram,
            edad: edad,
          },
          video: {
            fileName: video.fileName,
            streamUrl: getPublicVideoUrl(video.storageKey),
            instagramLikes: video.instagramLikes || 0,
            uploadedAt: video.uploadedAt,
            fps: video.fps || 30, 
          },
          scores: {
            average: Math.round(averageScore * 10) / 10,
            count: evaluationCount,
            breakdown,
          },
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b!.scores.average - a!.scores.average)
      .slice(0, limit)
      .map((item, index) => ({ position: index + 1, ...item }));
    const totalEvaluated = videos.filter(v => v.evaluations.length >= minEvaluations).length;
    return NextResponse.json({
      success: true,
      data: {
        rankings,
        metadata: {
          totalEvaluated,
          minEvaluationsRequired: minEvaluations,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json({ success: false, error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
