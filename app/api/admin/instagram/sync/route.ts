import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InstagramService } from '@/lib/instagram';
export const dynamic = 'force-dynamic';
export async function POST() {
    try {
        console.log('🤖 Instagram Robot: Starting Deep Sync...');
        const taggedMedia = await InstagramService.getTaggedMedia();
        if (!taggedMedia || taggedMedia.length === 0) {
            return NextResponse.json({ success: true, message: 'No media', stats: { processed: 0, updated: 0 } });
        }
        let updatedCount = 0;
        let processedCount = 0;
        const logs: string[] = [];
        const allParticipants = await prisma.participant.findMany({
            where: { instagram: { not: '' }, video: { isNot: null } },
            include: { video: true }
        });
        for (const media of taggedMedia) {
            processedCount++;
            const taggerUsername = media.username?.toLowerCase() || '';
            if (!taggerUsername) continue;
            const cleanTagger = taggerUsername.replace('@', '').trim();
            const match = allParticipants.find(p => {
                const dbHandle = p.instagram.toLowerCase().replace('@', '').trim();
                return dbHandle === cleanTagger;
            });
            if (match && match.video) {
                const shouldValidate = match.video.status === 'PENDING_UPLOAD' || match.video.status === 'PENDING_VALIDATION';
                
                const currentLikes = match.video.instagramLikes;
                let newLikes = currentLikes;
                
                if (media.like_count !== undefined && media.like_count !== null) {
                    newLikes = media.like_count;
                } else {
                     logs.push('⚠️ Media for ' + match.alias + ' has undefined likes. Keeping ' + currentLikes + '.');
                }
                await prisma.video.update({
                    where: { id: match.video.id },
                    data: {
                        instagramUrl: media.permalink,
                        instagramLikes: newLikes,
                        lastInstagramSync: new Date(),
                        status: shouldValidate ? 'VALIDATED' : undefined,
                        validatedAt: shouldValidate ? new Date() : undefined
                    }
                });
                updatedCount++;
                logs.push('✅ MATCH: @' + cleanTagger + ' -> Video ' + match.video.id + ' (Likes: ' + newLikes + ') ' + (shouldValidate ? '[AUTO-VALIDATED]' : ''));
            }
        }
        return NextResponse.json({
            success: true,
            message: 'Deep Sync processed ' + processedCount + ', updated ' + updatedCount,
            stats: { processed: processedCount, updated: updatedCount },
            logs
        });
    } catch (error: any) {
        console.error('Instagram Sync Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
