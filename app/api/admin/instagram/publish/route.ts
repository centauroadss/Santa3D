import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
// @ts-ignore
import { publishToInstagram } from '@/scripts/lib/instagram-publisher';
// @ts-ignore
import { generateStoryImage, generateFeedImage } from '@/scripts/lib/instagram-image-generator';
// @ts-ignore
import { generateInstagramCaption } from '@/scripts/lib/instagram-caption-generator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type } = body; // 'STORY' or 'FEED'

        if (!type) return NextResponse.json({ success: false, error: 'Type required' }, { status: 400 });

        // 1. Fetch Config
        const configDb = await prisma.instagramConfig.findFirst();

        // Construct CONFIG object compatible with generators
        const CONFIG = {
            accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
            userId: process.env.INSTAGRAM_USER_ID,
            publicDir: path.join(process.cwd(), 'public/temp-ig'),
            publicUrlBase: 'http://167.172.217.151/temp-ig',
            timerFormat: configDb?.timerFormat || 'd-h',
            // Color/Design configs
            designMode: configDb?.designMode || 'auto',
            customStoryBg: configDb?.customStoryBg,
            customFeedBg: configDb?.customFeedBg,
            participationMsgs: configDb?.participationMsgs ? JSON.parse(configDb.participationMsgs) : [],
            votingMsgs: configDb?.votingMsgs ? JSON.parse(configDb.votingMsgs) : []
        };

        // Ensure tokens exist
        if (!CONFIG.accessToken || !CONFIG.userId) {
            console.error('Missing Instagram Credentials');
            return NextResponse.json({ success: false, error: 'Server missing Instagram credentials' }, { status: 500 });
        }

        // 2. Fetch Stats & Ranking (Manual construction to ensure flat structure for generators)
        const totalParticipants = await prisma.participant.count();
        const totalVideos = await prisma.video.count({ where: { status: 'VALIDATED' } });
        const totalLikesResult = await prisma.video.aggregate({ _sum: { likes: true }, where: { status: 'VALIDATED' } });
        const totalLikes = totalLikesResult._sum.likes || 0;

        // Time logic - Fetch deadline from settings or hardcode
        const submissionDeadlineSetting = await prisma.contestSetting.findUnique({ where: { key: 'submission_deadline' } });
        const deadline = submissionDeadlineSetting ? new Date(submissionDeadlineSetting.value) : new Date('2025-12-30T23:59:59');
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        // Rankings for Caption/Image
        const topVideos = await prisma.video.findMany({
            where: { status: 'VALIDATED' },
            orderBy: { likes: 'desc' },
            take: 3,
            include: { participant: true }
        });

        const recentParticipants = topVideos.map((v: any) => ({
            name: v.participant.fullName || v.participant.instagram || 'Participante',
            instagram: v.participant.instagram,
            likes: v.likes,
            score: v.likes
        }));

        // FLAT STATS STRUCTURE (Critical for Generators)
        const stats = {
            participants: totalParticipants,
            videos: totalVideos,
            likes: totalLikes,
            timeLeft: {
                days: Math.max(0, days),
                hours: Math.max(0, hours),
                minutes: Math.max(0, minutes),
                isClosed: diff <= 0
            },
            instagramUsers: [],
            recentParticipants: recentParticipants,
            topRanked: recentParticipants
        };

        // 3. Generate & Publish
        let buffer;
        let caption = '';
        let result;

        console.log(`Generating content for ${type}...`);

        if (type === 'STORY') {
            buffer = await generateStoryImage(stats, CONFIG);
            result = await publishToInstagram(buffer, '', 'STORIES', CONFIG);
        } else {
            buffer = await generateFeedImage(stats, CONFIG);
            // Construct data specifically for caption generator
            const captionData = { ...stats, recentParticipants };
            try {
                caption = generateInstagramCaption(captionData);
            } catch (err: any) {
                console.error('Caption Generation Failed:', err);
                caption = 'Concurso Santa 3D Venezolano - ¡Participa!'; // Fallback
            }
            result = await publishToInstagram(buffer, caption, 'IMAGE', CONFIG);
        }

        return NextResponse.json({ success: true, output: result.log, id: result.id });

    } catch (error: any) {
        console.error('Publish API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
    }
}
