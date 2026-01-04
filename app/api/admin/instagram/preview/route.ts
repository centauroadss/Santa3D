
import { NextResponse } from 'next/server';
import { generateStoryImage, generateFeedImage } from '@/scripts/lib/instagram-image-generator';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, ...config } = body;

        // Mock stats for preview purposes
        const mockStats = {
            participants: 47,
            videos: 47,
            likes: 1250,
            timeLeft: { days: 5, hours: 12, minutes: 0, isClosed: false },
            instagramUsers: [],
            recentParticipants: [],
            topRanked: [
                { instagram: '@carlosm3d', likes: 120, name: 'Carlos' },
                { instagram: '@maria_art', likes: 98, name: 'Maria' },
                { instagram: '@luis_vfx', likes: 85, name: 'Luis' },
                { instagram: '@ana_design', likes: 72, name: 'Ana' },
                { instagram: '@pedro_3d', likes: 65, name: 'Pedro' }
            ]
        };

        let buffer;
        if (type === 'story') {
            buffer = await generateStoryImage(mockStats, config);
        } else {
            buffer = await generateFeedImage(mockStats, config);
        }

        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': buffer.length.toString()
            }
        });

    } catch (error: any) {
        console.error('Preview Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Error generating preview' }, { status: 500 });
    }
}
