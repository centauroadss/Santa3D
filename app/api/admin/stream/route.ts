import { NextRequest, NextResponse } from 'next/server';
import { CleanStorageService } from '@/lib/clean_storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
        }

        console.log(`[StreamAPI] Generating URL for key: ${key}`);
        const signedUrl = await CleanStorageService.getSignedUrl(key);

        return NextResponse.json({ url: signedUrl });
    } catch (error: any) {
        console.error('[StreamAPI] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate URL', details: error.message },
            { status: 500 }
        );
    }
}
