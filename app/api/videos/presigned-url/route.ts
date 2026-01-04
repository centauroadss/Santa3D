import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePresignedUploadUrl, generateVideoKey } from '@/lib/storage';
import { presignedUrlRequestSchema } from '@/lib/validations';
export async function POST(request: NextRequest) {
  try {
    const participantId = request.headers.get('x-participant-id');
    if (!participantId) {
      return NextResponse.json({ success: false, error: 'PARTICIPANT_ID_REQUIRED' }, { status: 400 });
    }
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { video: true },
    });
    if (!participant) return NextResponse.json({ success: false, error: 'PARTICIPANT_NOT_FOUND' }, { status: 404 });
    if (participant.video) return NextResponse.json({ success: false, error: 'VIDEO_ALREADY_UPLOADED' }, { status: 409 });
    const body = await request.json();
    const validatedData = presignedUrlRequestSchema.parse(body);
    const storageKey = generateVideoKey(participantId, validatedData.fileName);
    const uploadUrl = await generatePresignedUploadUrl(storageKey, validatedData.fileType, 3600);
    const video = await prisma.video.create({
      data: {
        participantId,
        fileName: validatedData.fileName,
        storageKey,
        fileSize: validatedData.fileSize,
        status: 'PENDING_UPLOAD',
      },
    });
    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        videoId: video.id,
        expiresIn: 3600,
        uploadInstructions: { method: 'PUT', headers: { 'Content-Type': validatedData.fileType } },
      },
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ success: false, error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
