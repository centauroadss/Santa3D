
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const count = await prisma.video.count();
        return NextResponse.json({
            success: true,
            data: { totalVideos: count }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
