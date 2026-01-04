
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string; // 'story' or 'feed'

        if (!file || !type) {
            return NextResponse.json({ success: false, error: 'Missing file or type' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define upload path: /uploads/instagram-bg
        // We use process.cwd() to target the root project folder
        const relativeUploadDir = `/uploads/instagram-bg`;
        const uploadDir = join(process.cwd(), 'public', relativeUploadDir);

        await mkdir(uploadDir, { recursive: true });

        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 10000)}`;
        const extension = file.name.split('.').pop() || 'png';
        const filename = `${type}-bg-${uniqueSuffix}.${extension}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);

        const publicUrl = `${relativeUploadDir}/${filename}`;

        // Update Database with the new URL
        // We assume ID 1 exists, or we update the first record found
        const firstConfig = await prisma.instagramConfig.findFirst();

        if (firstConfig) {
            await prisma.instagramConfig.update({
                where: { id: firstConfig.id },
                data: type === 'story' ? { customStoryBg: publicUrl } : { customFeedBg: publicUrl }
            });
        } else {
            // Create if not exists (Unlikely if flow flows correctly)
            await prisma.instagramConfig.create({
                data: {
                    storyHours: '08:00,20:00',
                    feedHours: '12:00',
                    participationMsgs: '[]',
                    votingMsgs: '[]',
                    designMode: 'custom',
                    customStoryBg: type === 'story' ? publicUrl : null,
                    customFeedBg: type === 'feed' ? publicUrl : null
                }
            });
        }

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
