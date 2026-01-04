import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { InstagramService } from '@/lib/instagram';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        // 1. Fetch LIVE data from Instagram (Exact same logic as Curation API)
        let instagramMedia: any[] = [];
        try {
            instagramMedia = await InstagramService.getTaggedMedia();
        } catch (e: any) {
            console.error('Error fetching from Instagram:', e);
        }
        // 2. Fetch all Participants with Instagram handles to cross-reference
        const participants = await prisma.participant.findMany({
            where: { instagram: { not: '' } },
            include: { video: true }
        });
        // 3. Merge Data (In-Memory Join)
        const formatted = instagramMedia.map((media) => {
            // Normalized matching (Exact same logic as Curation API)
            // Normalized matching (Exact same logic as Curation API)
            const cleanUser = (media.username || '').toLowerCase().replace('@', '').trim();

            // FIX: Find ALL matches, then prioritize the one with a video
            const candidates = participants.filter(p => p.instagram.toLowerCase().replace('@', '').trim() === cleanUser);

            // Sort: Video owners first. If multiple, maybe latest? logic: just video first is enough for now.
            candidates.sort((a, b) => {
                const aHasVideo = a.video ? 1 : 0;
                const bHasVideo = b.video ? 1 : 0;
                return bHasVideo - aHasVideo;
            });

            const owner = candidates[0];
            let status = 'UNLINKED';
            let dbId = null;
            let closingLikes = 0;
            let closingDate = null;
            let participantName = 'No Identificado';
            if (owner && owner.video) {
                status = owner.video.status;
                dbId = owner.video.id;
                participantName = `${owner.nombre} ${owner.apellido}`;
                // Specific fields for this View
                closingLikes = owner.video.closingLikes || 0;
                closingDate = owner.video.closingLikesAt;
            } else if (owner) {
                status = 'LINKED_NO_VIDEO';
                participantName = `${owner.nombre} ${owner.apellido}`;
            }
            return {
                id: media.id,
                dbId: dbId,
                thumbnailUrl: media.thumbnail_url || media.media_url || '',
                videoUrl: media.media_type === 'VIDEO' ? media.media_url : null,
                instagramUser: media.username ? `@${media.username}` : 'Anónimo',
                participantName: participantName,
                currentLikes: media.like_count || 0,
                closingLikes: closingLikes,
                closingDate: closingDate,
                instagramPermalink: media.permalink,
                status: status
            };
        });
        // 4. Sort: Priority to those who have a Closing Date (already frozen), then by Current Likes
        formatted.sort((a, b) => {
            // If one has closing date and other doesn't, prioritize the one strictly acting as closed? 
            // Or just simple sort by likes? 
            // User wants a "mirror" of curation usually implying sort by popularity.
            // Let's sort by current likes to match Curation default, 
            // BUT if we want to verify closing logic, maybe keep closing logic check.
            // Let's stick to Curation style: Popularity desc.
            return (b.currentLikes || 0) - (a.currentLikes || 0);
        });
        return NextResponse.json({
            success: true,
            data: formatted,
            debugInfo: {
                count: instagramMedia.length,
                mapped: formatted.filter(f => f.dbId).length
            }
        });
    } catch (error: any) {
        console.error('Likes Closing API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
