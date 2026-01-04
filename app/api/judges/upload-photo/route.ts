import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validar imagen
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Guardar localmente
        const { writeFile, mkdir } = await import('fs/promises');
        const path = await import('path');

        const uploadDir = path.join(process.cwd(), 'public', 'judges-photos');
        await mkdir(uploadDir, { recursive: true });

        const fileName = `judge_${user.id}_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        const fileUrl = `/judges-photos/${fileName}`;

        return NextResponse.json({ success: true, url: fileUrl });

    } catch (error) {
        console.error('Error uploading photo:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
