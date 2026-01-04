import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicVideoUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const judgeId = params.id;

        // Verify Judge exists
        const judge = await prisma.judge.findUnique({ where: { id: judgeId } });
        if (!judge) {
            return NextResponse.json({ success: false, error: 'Judge not found' }, { status: 404 });
        }

        // Fetch videos that HAVE been evaluated by this judge
        // We only care about evaluated videos for the report
        const evaluations = await prisma.evaluation.findMany({
            where: { judgeId },
            include: {
                video: {
                    include: {
                        participant: { select: { alias: true, instagram: true } }
                    }
                },
                criterionScores: { include: { criterion: true } }
            },
            orderBy: { evaluatedAt: 'desc' }
        });

        // Map to the same structure expected by EvaluatedVideosTable, but flatten a bit based on evaluation
        const processedVideos = await Promise.all(evaluations.map(async (ev) => {
            const v = ev.video;
            let streamUrl = v.url;

            // Resolve URL (Copy of Judges Logic)
            if ((!streamUrl || streamUrl.trim() === '') && v.storageKey) {
                try {
                    streamUrl = await getPublicVideoUrl(v.storageKey);
                } catch (e) {
                    streamUrl = '';
                }
            }
            if (!streamUrl) streamUrl = '';

            // Drive Patch
            if (streamUrl.includes('drive.google.com') && streamUrl.includes('/file/d/')) {
                const m = streamUrl.match(/\/d\/(.+?)\//);
                if (m && m[1]) streamUrl = `https://drive.google.com/uc?export=download&id=${m[1]}`;
            }

            return {
                id: v.id,
                fileName: v.fileName,
                streamUrl: streamUrl,
                uploadedAt: v.uploadedAt,
                resolution: v.resolution,
                duration: v.duration,
                fps: v.fps,
                participant: { alias: v.participant.alias, instagram: v.participant.instagram },
                // Direct Evaluation Data
                evaluation: {
                    id: ev.id,
                    puntajeTotal: ev.puntajeTotal,
                    evaluatedAt: ev.evaluatedAt,
                    observacionesGenerales: ev.observacionesGenerales,
                    criterionScores: ev.criterionScores
                },
                stats: {
                    totalVotes: 0, // Not needed for this report really, but keeping structure
                    pendingVotes: 0
                }
            };
        }));

        return NextResponse.json({
            success: true,
            data: {
                judge,
                videos: processedVideos
            }
        });

    } catch (error) {
        console.error('Error fetching judge evaluations:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
