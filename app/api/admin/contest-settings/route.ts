import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            // See note in previous version
        }

        const isClosedSetting = await prisma.contestSetting.findUnique({ where: { key: 'CONTEST_IS_CLOSED' } });
        const closedAtSetting = await prisma.contestSetting.findUnique({ where: { key: 'CONTEST_CLOSED_AT' } });
        const showScoresSetting = await prisma.contestSetting.findUnique({ where: { key: 'SHOW_PUBLIC_SCORES' } });

        const data = {
            isClosed: isClosedSetting?.value === 'true',
            closedAt: closedAtSetting?.value || null,
            showPublicScores: showScoresSetting?.value === 'true' // Default false if null
        };

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Contest settings error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Handle direct "isClosed" toggle (Legacy/Existing UI behavior)
        if (typeof body.isClosed !== 'undefined') {
            const { isClosed } = body;
            // Upsert IS_CLOSED
            await prisma.contestSetting.upsert({
                where: { key: 'CONTEST_IS_CLOSED' },
                update: { value: String(isClosed) },
                create: { key: 'CONTEST_IS_CLOSED', value: String(isClosed) }
            });

            let closedAt = null;
            if (isClosed) {
                closedAt = new Date().toISOString();
                await prisma.contestSetting.upsert({
                    where: { key: 'CONTEST_CLOSED_AT' },
                    update: { value: closedAt },
                    create: { key: 'CONTEST_CLOSED_AT', value: closedAt }
                });

                // [FIX] - SNAPSHOT LIKES AUTOMATICALLY
                try {
                    await prisma.$executeRaw`
                        UPDATE videos 
                        SET closingLikes = instagramLikes, 
                            closingLikesAt = NOW() 
                        WHERE status = 'VALIDATED'
                    `;
                    console.log('✅ Snapshot of closing likes executed successfully.');
                } catch (snapError) {
                    console.error('Failed to snapshot likes:', snapError);
                }

            } else {
                try {
                    await prisma.contestSetting.delete({ where: { key: 'CONTEST_CLOSED_AT' } });
                } catch (e) { /* ignore if not exists */ }
            }
            return NextResponse.json({ success: true, data: { isClosed, closedAt } });
        }

        // Handle "showPublicScores" toggle (New UI)
        if (typeof body.showPublicScores !== 'undefined') {
            const { showPublicScores } = body;
            await prisma.contestSetting.upsert({
                where: { key: 'SHOW_PUBLIC_SCORES' },
                update: { value: String(showPublicScores) },
                create: { key: 'SHOW_PUBLIC_SCORES', value: String(showPublicScores) }
            });
            return NextResponse.json({ success: true, data: { showPublicScores } });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contest settings update error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
