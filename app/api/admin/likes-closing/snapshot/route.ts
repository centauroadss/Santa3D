import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { InstagramService } from '@/lib/instagram';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false }, { status: 401 });
        const instagramMedia = await InstagramService.getTaggedMedia();
        const participants = await prisma.participant.findMany({
            where: { instagram: { not: '' }, video: { isNot: null } },
            include: { video: true }
        });
        const updates = [];
        const timestamp = new Date();
        for (const p of participants) {
            if (!p.video) continue;
            
            const cleanUser = p.instagram.toLowerCase().replace('@', '').trim();
            const media = instagramMedia.find(m => (m.username || '').toLowerCase().replace('@', '').trim() === cleanUser);
            
            let likesToSnapshot = -1;
            
            if (media && typeof media.like_count === 'number') {
                likesToSnapshot = media.like_count;
            } else if (p.video.instagramLikes !== null) {
                // Fallback to internal DB value
                likesToSnapshot = p.video.instagramLikes;
                console.log(`[Snapshot] Fallback for ${p.instagram}: ${likesToSnapshot}`);
            }

            if (likesToSnapshot >= 0) {
                updates.push(prisma.video.update({
                    where: { id: p.video.id },
                    data: {
                        closingLikes: likesToSnapshot,
                        closingLikesAt: timestamp,
                        // Only update live likes if we pulled fresh data
                        ...(media ? { instagramLikes: likesToSnapshot, lastInstagramSync: timestamp } : {})
                    }
                }));
            }
        }
        await prisma.$transaction(updates);
        return NextResponse.json({ success: true, message: `Updated ${updates.length} videos.` });
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
