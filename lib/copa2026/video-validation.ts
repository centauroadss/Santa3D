import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';

const execAsync = util.promisify(exec);

export interface VideoAnalysis {
    resolution: string;
    durationSeg: number;
    fps: number;
    formato: string;
    warnings: string[];
}

export async function analyzeVideo(url: string): Promise<VideoAnalysis> {
    const tempFile = path.join(os.tmpdir(), \`video-\${Date.now()}.tmp\`);
    
    try {
        // 1. Download file temporarily
        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(tempFile);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            }).on('error', (err) => {
                fs.unlink(tempFile, () => {});
                reject(err);
            });
        });

        // 2. Run ffprobe
        const command = \`ffprobe -v quiet -print_format json -show_streams -show_format "\${tempFile}"\`;
        const { stdout } = await execAsync(command);
        const data = JSON.parse(stdout);

        const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');
        const formatData = data.format;

        if (!videoStream) {
            throw new Error('No video stream found in file');
        }

        const resolution = \`\${videoStream.width}x\${videoStream.height}\`;
        const durationSeg = parseFloat(videoStream.duration || formatData.duration || '0');
        
        let fps = 0;
        if (videoStream.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/');
            if (num && den) fps = parseFloat(num) / parseFloat(den);
        }

        const formato = formatData.format_name; // e.g. "mov,mp4,m4a,3gp,3g2,mj2"

        // 3. Generate Warnings
        const warnings: string[] = [];
        if (resolution !== '1024x2048') {
            warnings.push(\`Resolución incorrecta: Se esperaba 1024x2048, pero se recibió \${resolution}.\`);
        }
        if (durationSeg > 31) {
            warnings.push(\`Duración excesiva: Se esperaban 30s, pero el video dura \${durationSeg.toFixed(1)}s.\`);
        }
        if (Math.abs(fps - 30) > 1) { // Allow slight variations like 29.97
            warnings.push(\`FPS incorrectos: Se esperaban 30fps, pero se recibieron \${fps.toFixed(1)}fps.\`);
        }
        if (!formato.includes('mp4')) {
            warnings.push(\`Formato incorrecto: Se esperaba video/mp4, pero se detectó \${formato}.\`);
        }

        return {
            resolution,
            durationSeg,
            fps,
            formato,
            warnings
        };

    } finally {
        // Clean up
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    }
}
