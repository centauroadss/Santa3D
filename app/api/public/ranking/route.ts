
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InstagramService } from '@/lib/instagram';
import { StorageService } from '@/lib/storage';

// Force dynamic behavior
export const dynamic = 'force-dynamic';

// --- HELPER: Logic from Judge API ---
import { getPublicVideoUrl } from '@/lib/storage'; // Added Import

// --- HELPER: Logic from Judge API (FORCE PUBLIC URL) ---
async function toStreamUrl(video: any): Promise<string> {
    if (!video) return '';
    let streamUrl = video.url;

    // 1. Resolve URL if missing using Storage Key (FORCE PUBLIC URL MATCHING JUDGE API)
    if ((!streamUrl || streamUrl.trim() === '') && video.storageKey) {
        streamUrl = await getPublicVideoUrl(video.storageKey);
    }

    // REMOVED: Faulty logic that corrupted valid CDN URLs
    // else if (streamUrl && streamUrl.includes('digitaloceanspaces') ...

    // 2. Fallback - FORCE FALLBACK TO RAW URL IF EMPTY
    if (!streamUrl || streamUrl === '') {
        streamUrl = video.url || '';
    }

    // 3. Google Drive Patch (unchanged)
    if (streamUrl.includes('drive.google.com') && streamUrl.includes('/view')) {
        const idMatch = streamUrl.match(/\/d\/([^/]+)/);
        if (idMatch && idMatch[1]) {
            return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
        }
    }
    if (streamUrl.includes('drive.google.com') && streamUrl.includes('/file/d/')) {
        const m = streamUrl.match(/\/d\/(.+?)\//);
        if (m && m[1]) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    }

    return streamUrl;
}

// --- SYNC LOGIC (Unchanged - Proven Working) ---
const SYNC_INTERVAL_MS = 30000; // 30 seconds

async function performThrottledSync() {
    try {
        const setting = await prisma.contestSetting.findUnique({
            where: { key: 'last_instagram_sync' }
        });
        const lastSync = setting?.value ? new Date(setting.value).getTime() : 0;
        const now = Date.now();

        if (now - lastSync > SYNC_INTERVAL_MS) {
            console.log('🔄 Ranking API: Triggering Auto-Sync...');

            const taggedMedia = await InstagramService.getTaggedMedia();

            if (taggedMedia && taggedMedia.length > 0) {

                for (const media of taggedMedia) {
                    if (!media.username) continue;
                    const cleanUser = media.username.replace('@', '').toLowerCase().trim();
                    const likes = media.like_count || 0;

                    const parts = await prisma.participant.findMany({
                        where: { instagram: { contains: cleanUser } },
                        include: { video: true }
                    });

                    for (const part of parts) {
                        if (part.instagram.toLowerCase().replace('@', '').trim() === cleanUser && part.video) {
                            await prisma.video.update({
                                where: { id: part.video.id },
                                data: {
                                    instagramLikes: likes,
                                    instagramUrl: media.permalink,
                                    lastInstagramSync: new Date()
                                }
                            });
                        }
                    }
                }
            }

            await prisma.contestSetting.upsert({
                where: { key: 'last_instagram_sync' },
                update: { value: new Date().toISOString() },
                create: {
                    key: 'last_instagram_sync',
                    value: new Date().toISOString()
                }
            });
            console.log('✅ Ranking API: Auto-Sync Complete');
        }
    } catch (e) {
        console.error('⚠️ Ranking API Sync Error (Non-Fatal):', e);
    }
}

export async function GET() {
    try {
        // 1. Check Contest Status
        const statusSetting = await prisma.contestSetting.findUnique({ where: { key: 'CONTEST_IS_CLOSED' } });
        const showScoresSetting = await prisma.contestSetting.findUnique({ where: { key: 'SHOW_PUBLIC_SCORES' } });

        const isClosed = statusSetting?.value === 'true';
        const showPublicScores = showScoresSetting?.value === 'true';

        // ---------------------------------------------------------
        // CASE 1: CONTEST OPEN (LIVE RANKING BY LIKES)
        // ---------------------------------------------------------
        if (!isClosed) {
            await performThrottledSync();

            const topVideos = await prisma.video.findMany({
                where: {
                    status: 'VALIDATED',
                    lastInstagramSync: { not: null }
                },
                orderBy: {
                    instagramLikes: 'desc'
                },
                take: 5,
                include: {
                    participant: {
                        select: {
                            alias: true,
                            instagram: true,
                        }
                    }
                }
            });

            const ranking = await Promise.all(topVideos.map(async (video, index) => ({
                id: video.id,
                position: index + 1,
                alias: video.participant.alias,
                instagram: video.participant.instagram,
                score: video.instagramLikes,
                streamUrl: await toStreamUrl(video),
                isLikes: true,
                hiddenScore: false // Likes are always visible
            })));

            return NextResponse.json({ success: true, data: ranking }, { headers: { 'Cache-Control': 'no-store' } });
        }

        // ---------------------------------------------------------
        // CASE 2: CONTEST CLOSED (AWARDED RANKING - WEIGHTED)
        // ---------------------------------------------------------
        // Fetch valid videos with evaluations
        const allVideos = await prisma.video.findMany({
            where: { status: 'VALIDATED' }, // Fetch all to calculate rank
            include: {
                participant: true,
                evaluations: {
                    include: {
                        judge: true,
                        criterionScores: true
                    }
                }
            }
        });

        // Calculate Scores (Logic synced with Admin Results)
        const candidates = allVideos.map(video => {
            // A. Jury Score (Average 0-100)
            let juryAvg = 0;
            if (video.evaluations.length > 0) {
                const sum = video.evaluations.reduce((acc, ev) => {
                    return acc + ev.puntajeTotal;
                }, 0);
                juryAvg = sum / video.evaluations.length;
            }

            // B. Public Score (Normalized 0-100)
            // Use closingLikes if available (snapshot), otherwise current likes
            const likesCount = video.closingLikes ?? video.instagramLikes ?? 0;

            // Calculate max likes from the set (using same logic)
            const maxLikes = Math.max(...allVideos.map(v => v.closingLikes ?? v.instagramLikes ?? 0));

            const publicScore = maxLikes > 0 ? (likesCount / maxLikes) * 100 : 0;

            // C. Weighted Final Score -> CHANGED TO PURE JURY AVERAGE (ADMIN CONSISTENCY)
            // Previous: (juryAvg * 0.6) + (publicScore * 0.4);
            // New: Pure Jury Average (0-100)
            const finalScore = juryAvg;

            return {
                video,
                finalScore
            };
        });

        // Sort descending
        candidates.sort((a, b) => b.finalScore - a.finalScore);

        // Take Top 5
        const top5 = candidates.slice(0, 5);

        const ranking = await Promise.all(top5.map(async (item, index) => ({
            id: item.video.id,
            position: index + 1,
            alias: item.video.participant.alias,
            instagram: item.video.participant.instagram,
            score: Math.round(item.finalScore * 10) / 10, // 1 decimal place
            streamUrl: await toStreamUrl(item.video),
            isLikes: false, // Indicates "Points" mode
            hiddenScore: !showPublicScores // Controlled by admin
        })));

        return NextResponse.json({ success: true, data: ranking }, { headers: { 'Cache-Control': 'no-store' } });

    } catch (error) {
        console.error('Error fetching ranking:', error);
        return NextResponse.json(
            { success: false, error: 'INTERNAL_SERVER_ERROR' },
            { status: 500 }
        );
    }
}
