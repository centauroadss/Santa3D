
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth-edge';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Robust Logs
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100 // Increased limit
        });

        // 2. Fetch Judges Password Status
        const judges = await prisma.judge.findMany({
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                isDefaultPassword: true,
                resetRequested: true, // New flag
                updatedAt: true
            },
            orderBy: { nombre: 'asc' }
        });

        // Transform for UI
        const usersTable = judges.map(j => ({
            id: j.id,
            name: `${j.nombre} ${j.apellido || ''}`,
            email: j.email,
            isDefault: j.isDefaultPassword,
            resetRequested: j.resetRequested,
            lastUpdate: j.updatedAt
        }));

        return NextResponse.json({
            success: true,
            data: {
                logs, // Now contains targetEmail, targetName, severity, etc.
                users: usersTable
            }
        });

    } catch (error) {
        console.error('Error fetching security data:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
