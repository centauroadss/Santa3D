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
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'all';
        // 1. Fetch LIVE data
        let instagramMedia: any[] = [];
        let debugError = null;
        try {
            instagramMedia = await InstagramService.getTaggedMedia();
        } catch (e: any) {
            console.error('Error fetching from Instagram:', e);
            debugError = e.message;
        }
        // 2. Fetch Participants
        const participants = await prisma.participant.findMany({
            where: { instagram: { not: '' } },
            include: { video: true }
        });
        // 3. Process Logic
        const formatted = await Promise.all(instagramMedia.map(async (media) => {
            const rawUsername = media.username || '';
            const mediaUsername = rawUsername.toLowerCase().replace('@', '').trim();
            // MATCHING STRATEGY (STRICT)
            let owner = participants.find(p => {
                const pHandle = p.instagram?.toLowerCase().replace('@', '').trim();
                return pHandle === mediaUsername && p.video !== null;
            });
            if (!owner) {
                owner = participants.find(p => {
                    const pHandle = p.instagram?.toLowerCase().replace('@', '').trim();
                    return pHandle === mediaUsername;
                });
            }
            // DEFAULT STATUS: If user not found, or user found but no video
            let status = 'UNLINKED';
            let dbId = '';
            if (owner && owner.video) {
                const currentStatus = owner.video.status;
                const isPending = currentStatus === 'PENDING_UPLOAD' || currentStatus === 'PENDING_VALIDATION';
                
                // DATA SAFETY
                const newLikes = (media.like_count !== undefined && media.like_count !== null) 
                                 ? media.like_count 
                                 : owner.video.instagramLikes;
                const dataToUpdate: any = {
                    instagramUrl: media.permalink,
                    instagramLikes: newLikes, 
                    lastInstagramSync: new Date()
                };
                // AUTO-VALIDATION LOGIC
                if (isPending) {
                    console.log('⚡ AUTO-VALIDATING: User ' + owner.instagram + ' (Video ' + owner.video.id + ') matched Instagram Media ' + media.id);
                    dataToUpdate.status = 'VALIDATED';
                    dataToUpdate.validatedAt = new Date();
                    
                    // IMPORTANT: Return correct string for frontend
                    status = 'VALIDATED';
                    owner.video.status = 'VALIDATED'; 
                } else {
                    // Return existing DB status (VALIDATED or REJECTED)
                    status = currentStatus;
                }
                // PERFORM UPDATE
                if (isPending || (media.like_count !== undefined && owner.video.instagramLikes !== media.like_count)) {
                     await prisma.video.update({
                        where: { id: owner.video.id },
                        data: dataToUpdate
                    }).catch(err => console.error('Error auto-validating:', err));
                }
                
                dbId = owner.video.id;
            } else if (owner) {
                status = 'LINKED_NO_VIDEO';
            }
            return {
                id: media.id,
                dbId: dbId,
                thumbnailUrl: media.thumbnail_url || media.media_url || '',
                videoUrl: media.media_type === 'VIDEO' ? media.media_url : null,
                instagramUser: rawUsername ? '@' + rawUsername : 'Anónimo',
                participantName: owner ? owner.nombre + ' ' + owner.apellido : 'No Identificado',
                uploadedAt: media.timestamp,
                likes: media.like_count || 0,
                instagramPermalink: media.permalink,
                status: status, // Now returns VALIDATED, PENDING_VALIDATION, etc.
                mediaType: media.media_type,
                isUserFound: !!(owner && owner.video), 
                hasDbVideo: !!(owner && owner.video),
                isJudgeSelected: owner?.video?.isJudgeSelected || false
            };
        }));
        // 4. Filtering
        const filtered = formatted.filter(item => {
            // Frontend filter logic maps 'pending' to non-validated items
            if (filter === 'pending') return item.status !== 'VALIDATED' && item.status !== 'REJECTED';
            if (filter === 'validated') return item.status === 'VALIDATED';
            return true;
        });
        filtered.sort((a, b) => b.likes - a.likes);
        return NextResponse.json({
            success: true,
            data: filtered,
            debugInfo: {
                error: debugError,
                count: instagramMedia.length
            }
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
