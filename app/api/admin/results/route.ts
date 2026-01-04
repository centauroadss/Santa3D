import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Authenticate as Admin
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get total number of judges to calculate pending votes
        const totalJudges = await prisma.judge.count();

        const videos = await prisma.video.findMany({
            where: { status: 'VALIDATED' },
            include: {
                participant: true,
                evaluations: {
                    include: {
                        judge: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true
                            }
                        },
                        criterionScores: {
                            include: {
                                criterion: true
                            }
                        }
                    }
                }
            }
        });

        const results = videos.map(video => {
            const voteCount = video.evaluations.length;
            const pendingCount = totalJudges - voteCount;
            const totalScoreSum = video.evaluations.reduce((acc, curr) => acc + curr.puntajeTotal, 0);
            const averageScore = voteCount > 0 ? (totalScoreSum / voteCount) : 0;

            return {
                id: video.id,
                thumbnail: video.url,
                participantName: `${video.participant.nombre} ${video.participant.apellido}`,
                alias: video.participant.alias,
                email: video.participant.email,
                instagram: video.participant.instagram,

                // Tech Specs
                resolution: video.resolution,
                fps: video.fps,
                duration: video.duration,
                format: video.format,

                uploadedAt: video.uploadedAt,

                // Likes Data
                likes: video.instagramLikes,
                instagramLikes: video.instagramLikes,
                closingLikes: video.closingLikes,
                closingLikesAt: video.closingLikesAt,

                // Metrics
                voteCount,
                pendingCount: pendingCount < 0 ? 0 : pendingCount,
                totalScoreSum,
                averageScore,

                isJudgeSelected: video.isJudgeSelected,

                // Detailed Evaluations
                evaluations: video.evaluations.map(ev => ({
                    judgeName: `${ev.judge.nombre} ${ev.judge.apellido || ''}`,
                    score: ev.puntajeTotal,
                    comments: ev.observacionesGenerales || 'Sin comentarios',
                    evaluatedAt: ev.evaluatedAt,
                    criterionScores: ev.criterionScores.map(cs => ({
                        name: cs.criterion.nombre,
                        weight: cs.criterion.peso,
                        score: cs.puntaje
                    })).sort((a, b) => a.name.localeCompare(b.name))
                }))
            };
        });

        // Sort by Average Score Descending
        results.sort((a, b) => b.averageScore - a.averageScore);

        return NextResponse.json({ success: true, data: results });

    } catch (error) {
        console.error('Admin results error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
