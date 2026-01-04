
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get Config
        const config = await prisma.instagramConfig.findFirst();

        // "Official Grid" implies status = VALIDATED.
        // If config requires restriction, we filter strictly.
        // If not, we might show PENDING_VALIDATION too, but definitely not REJECTED.
        const restrictToGrid = config?.restrictToOfficialGrid ?? true;

        const whereClause = restrictToGrid
            ? { status: 'VALIDATED' as any }
            : { status: { not: 'REJECTED' as any } };

        // 2. Stats Counts
        const totalVideos = await prisma.video.count({
            where: whereClause
        });

        const totalParticipants = totalVideos; // 1-to-1 relation usually

        const likesAgg = await prisma.video.aggregate({
            _sum: { instagramLikes: true },
            where: whereClause
        });
        const totalLikes = likesAgg._sum.instagramLikes || 0;

        // 3. Top Ranked (Leaderboard)
        // Used for the "Top 5" list in images
        const topVideos = await prisma.video.findMany({
            where: {
                ...whereClause,
                instagramLikes: { gt: 0 } // Show only those with likes
            },
            take: 5,
            orderBy: { instagramLikes: 'desc' },
            include: {
                participant: {
                    select: {
                        nombre: true,
                        alias: true,
                        instagram: true
                    }
                }
            }
        });

        const topRanked = topVideos.map((v: any, index: number) => ({
            position: index + 1,
            name: v.participant.alias || v.participant.nombre,
            instagram: v.participant.instagram,
            likes: v.instagramLikes
        }));

        // 4. Time Left Calculation
        // Try to get deadline from settings, else default to End of Year
        const deadlineSetting = await prisma.contestSetting.findUnique({
            where: { key: 'deadline' }
        });

        // Default Deadline: Dec 31, 2025? Or user specific?
        // Let's use a safe default or checking if 'deadline' setting exists in DB (common pattern)
        const deadlineStr = deadlineSetting?.value || '2025-12-30T23:59:59';
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const timeLeft = {
            days: days > 0 ? days : 0,
            hours: hours > 0 ? hours : 0,
            minutes: 0,
            isClosed: diff <= 0
        };

        // 5. Recent Participants (Optional, for feed caption)
        const recentVideos = await prisma.video.findMany({
            where: whereClause,
            take: 3,
            orderBy: { uploadedAt: 'desc' },
            include: { participant: true }
        });

        const recentParticipants = recentVideos.map((v: any) => ({
            name: v.participant.alias || v.participant.nombre,
            instagram: v.participant.instagram
        }));

        return NextResponse.json({
            participants: totalParticipants,
            videos: totalVideos,
            likes: totalLikes,
            timeLeft,
            instagramUsers: topRanked.map((t: any) => t.instagram).filter(Boolean),
            recentParticipants,
            topRanked
        });

    } catch (error) {
        console.error('[API Stats] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
