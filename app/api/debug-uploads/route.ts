import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const cwd = process.cwd();
    const publicDir = path.join(cwd, 'public');
    const uploadDir = path.join(publicDir, 'uploads');
    
    let publicFiles = [];
    if (fs.existsSync(publicDir)) {
      publicFiles = fs.readdirSync(publicDir);
    }
    
    let uploadFiles = [];
    if (fs.existsSync(uploadDir)) {
        try {
           uploadFiles = fs.readdirSync(path.join(uploadDir, 'perfiles_2026'));
        } catch (e) {}
    }

    return NextResponse.json({
      cwd,
      publicExists: fs.existsSync(publicDir),
      uploadsExists: fs.existsSync(uploadDir),
      publicFiles,
      uploadFiles,
      __dirname
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
