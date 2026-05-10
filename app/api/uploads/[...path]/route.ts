import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, ...params.path);

    if (!fs.existsSync(filePath)) {
      // Fallback for files lost during ephemeral container redeploys
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="100%" height="100%" fill="#2a2a2a"/>
        <text x="50%" y="45%" font-family="Arial" font-size="24" fill="#888" text-anchor="middle">Imagen no disponible</text>
        <text x="50%" y="55%" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">(Borrada por reinicio del servidor)</text>
      </svg>`;
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store',
        },
      });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Detect content type
    let contentType = 'application/octet-stream';
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.mp4') contentType = 'video/mp4';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving local file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
