import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const { videoId, isSelected } = await request.json();
        if (!videoId || typeof isSelected !== 'boolean') {
            return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
        }
        const video = await prisma.video.findUnique({
            where: { id: videoId },
        });
        if (!video) {
            return NextResponse.json({ success: false, error: 'Video not found' }, { status: 404 });
        }
        // DOUBLE VALIDATION CHECK
        // The check must be strict: Video status must be 'VALIDATED'
        if (isSelected && video.status !== 'VALIDATED') {
            return NextResponse.json({
                success: false,
                error: 'Solo videos VALIDADOS pueden ser enviados a jueces.'
            }, { status: 400 });
        }
        const updated = await prisma.video.update({
            where: { id: videoId },
            data: {
                isJudgeSelected: isSelected
            }
        });
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('Toggle Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
