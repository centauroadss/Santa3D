import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const isClosedSetting = await prisma.contestSetting.findUnique({ where: { key: 'CONTEST_IS_CLOSED' } });
        const closedAtSetting = await prisma.contestSetting.findUnique({ where: { key: 'CONTEST_CLOSED_AT' } });

        return NextResponse.json({
            isClosed: isClosedSetting?.value === 'true',
            closedAt: closedAtSetting?.value || null
        });
    } catch (error) {
        return NextResponse.json({ isClosed: false, error: 'Failed to fetch status' }, { status: 500 });
    }
}
