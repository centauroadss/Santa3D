import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { videoIds, action } = body; // action: 'approve' | 'reject' (future)

        if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
            return NextResponse.json({ success: false, error: 'No videos selected' }, { status: 400 });
        }

        if (action === 'approve') {
            await prisma.video.updateMany({
                where: {
                    id: { in: videoIds }
                },
                data: {
                    status: 'VALIDATED',
                    validatedAt: new Date()
                }
            });

            return NextResponse.json({
                success: true,
                message: `✅ Se han aprobado ${videoIds.length} videos para los jueces.`
            });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Error validating videos:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
