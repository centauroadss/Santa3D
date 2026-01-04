#!/bin/bash
echo "📦 Writing Part 2: Ranking Logic & Public Results..."

# 1. app/api/public/ranking/route.ts
cat << 'EOF' > app/api/public/ranking/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InstagramService } from '@/lib/instagram';
import { StorageService } from '@/lib/storage';

// Force dynamic behavior
export const dynamic = 'force-dynamic';

// --- HELPER: Logic from Judge API ---
async function toStreamUrl(video: any): Promise<string> {
    if (!video) return '';
    let streamUrl = video.url;

    // 1. Resolve URL if missing using Storage Key (FORCE SIGNED - BACKUP LOGIC)
    if ((!streamUrl || streamUrl.trim() === '') && video.storageKey) {
        streamUrl = await StorageService.getSignedVideoUrl(video.storageKey);
    }
    // Check if looks like a broken public URL and regenerate
    else if (streamUrl && streamUrl.includes('digitaloceanspaces') && video.storageKey) {
        try {
            // Check accessibility? No, just sign it to be safe if we have the key
            // Actually, if we have a URL in DB (video.url), it might be the broken one.
            // Safe bet: If we have storageKey, ALWAYS generate a fresh signed URL.
            streamUrl = await StorageService.getSignedVideoUrl(video.storageKey);
        } catch (e) { /* ignore */ }
    }

    // 2. Fallback
    if (!streamUrl) streamUrl = '';

    // 3. Google Drive Patch (View -> Download)
    if (streamUrl.includes('drive.google.com') && streamUrl.includes('/view')) {
        const idMatch = streamUrl.match(/\/d\/([^/]+)/);
        if (idMatch && idMatch[1]) {
            return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
        }
    }
    // Also handle /file/d/ format if present (as seen in Judge API)
    if (streamUrl.includes('drive.google.com') && streamUrl.includes('/file/d/')) {
        const m = streamUrl.match(/\/d\/(.+?)\//);
        if (m && m[1]) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    }

    return streamUrl;
}

// --- SYNC LOGIC (Unchanged - Proven Working) ---
const SYNC_INTERVAL_MS = 30000; // 30 seconds

async function performThrottledSync() {
    try {
        const setting = await prisma.contestSetting.findUnique({
            where: { key: 'last_instagram_sync' }
        });
        const lastSync = setting?.value ? new Date(setting.value).getTime() : 0;
        const now = Date.now();

        if (now - lastSync > SYNC_INTERVAL_MS) {
            console.log('🔄 Ranking API: Triggering Auto-Sync...');

            const taggedMedia = await InstagramService.getTaggedMedia();

            if (taggedMedia && taggedMedia.length > 0) {

                for (const media of taggedMedia) {
                    if (!media.username) continue;
                    const cleanUser = media.username.replace('@', '').toLowerCase().trim();
                    const likes = media.like_count || 0;

                    const parts = await prisma.participant.findMany({
                        where: { instagram: { contains: cleanUser } },
                        include: { video: true }
                    });

                    for (const part of parts) {
                        if (part.instagram.toLowerCase().replace('@', '').trim() === cleanUser && part.video) {
                            await prisma.video.update({
                                where: { id: part.video.id },
                                data: {
                                    instagramLikes: likes,
                                    instagramUrl: media.permalink,
                                    lastInstagramSync: new Date()
                                }
                            });
                        }
                    }
                }
            }

            await prisma.contestSetting.upsert({
                where: { key: 'last_instagram_sync' },
                update: { value: new Date().toISOString() },
                create: {
                    key: 'last_instagram_sync',
                    value: new Date().toISOString()
                }
            });
            console.log('✅ Ranking API: Auto-Sync Complete');
        }
    } catch (e) {
        console.error('⚠️ Ranking API Sync Error (Non-Fatal):', e);
    }
}

export async function GET() {
    try {
        // 1. Check Contest Status
        const statusSetting = await prisma.contestSetting.findUnique({ where: { key: 'CONTEST_IS_CLOSED' } });
        const showScoresSetting = await prisma.contestSetting.findUnique({ where: { key: 'SHOW_PUBLIC_SCORES' } });

        const isClosed = statusSetting?.value === 'true';
        const showPublicScores = showScoresSetting?.value === 'true';

        // ---------------------------------------------------------
        // CASE 1: CONTEST OPEN (LIVE RANKING BY LIKES)
        // ---------------------------------------------------------
        if (!isClosed) {
            await performThrottledSync();

            const topVideos = await prisma.video.findMany({
                where: {
                    status: 'VALIDATED',
                    lastInstagramSync: { not: null }
                },
                orderBy: {
                    instagramLikes: 'desc'
                },
                take: 5,
                include: {
                    participant: {
                        select: {
                            alias: true,
                            instagram: true,
                        }
                    }
                }
            });

            const ranking = await Promise.all(topVideos.map(async (video, index) => ({
                id: video.id,
                position: index + 1,
                alias: video.participant.alias,
                instagram: video.participant.instagram,
                score: video.instagramLikes,
                streamUrl: await toStreamUrl(video),
                isLikes: true,
                hiddenScore: false // Likes are always visible
            })));

            return NextResponse.json({ success: true, data: ranking }, { headers: { 'Cache-Control': 'no-store' } });
        }

        // ---------------------------------------------------------
        // CASE 2: CONTEST CLOSED (AWARDED RANKING - WEIGHTED)
        // ---------------------------------------------------------
        // Fetch valid videos with evaluations
        const allVideos = await prisma.video.findMany({
            where: { status: 'VALIDATED' }, // Fetch all to calculate rank
            include: {
                participant: true,
                evaluations: {
                    include: {
                        judge: true,
                        criterionScores: true
                    }
                }
            }
        });

        // Calculate Scores (Logic synced with Admin Results)
        const candidates = allVideos.map(video => {
            // A. Jury Score (Average 0-100)
            let juryAvg = 0;
            if (video.evaluations.length > 0) {
                const sum = video.evaluations.reduce((acc, ev) => {
                    return acc + ev.puntajeTotal;
                }, 0);
                juryAvg = sum / video.evaluations.length;
            }

            // B. Public Score (Normalized 0-100)
            // Use closingLikes if available (snapshot), otherwise current likes
            const likesCount = video.closingLikes ?? video.instagramLikes ?? 0;

            // Calculate max likes from the set (using same logic)
            const maxLikes = Math.max(...allVideos.map(v => v.closingLikes ?? v.instagramLikes ?? 0));

            const publicScore = maxLikes > 0 ? (likesCount / maxLikes) * 100 : 0;

            // C. Weighted Final Score
            // 60% Jury + 40% Public
            // If no jury votes, score is based purely on likes? No, stick to formula.
            // If 0 jury votes, juryAvg is 0.
            const finalScore = (juryAvg * 0.6) + (publicScore * 0.4);

            return {
                video,
                finalScore
            };
        });

        // Sort descending
        candidates.sort((a, b) => b.finalScore - a.finalScore);

        // Take Top 5
        const top5 = candidates.slice(0, 5);

        const ranking = await Promise.all(top5.map(async (item, index) => ({
            id: item.video.id,
            position: index + 1,
            alias: item.video.participant.alias,
            instagram: item.video.participant.instagram,
            score: Math.round(item.finalScore * 10) / 10, // 1 decimal place
            streamUrl: await toStreamUrl(item.video),
            isLikes: false, // Indicates "Points" mode
            hiddenScore: !showPublicScores // Controlled by admin
        })));

        return NextResponse.json({ success: true, data: ranking }, { headers: { 'Cache-Control': 'no-store' } });

    } catch (error) {
        console.error('Error fetching ranking:', error);
        return NextResponse.json(
            { success: false, error: 'INTERNAL_SERVER_ERROR' },
            { status: 500 }
        );
    }
}
EOF

# 2. components/ui/PublicResults.tsx
cat << 'EOF' > components/ui/PublicResults.tsx
// components/ui/PublicResults.tsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '@/components/ui/Card';
import KioskoVideoPlayer from '@/components/ui/KioskoVideoPlayer';
interface RankingEntry {
    id: string;
    alias: string;
    instagram: string;
    score: number;
    position: number;
    streamUrl?: string; // Now robust from server
    isLikes?: boolean;
    hiddenScore?: boolean;
}
export default function PublicResults() {
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<RankingEntry | null>(null);
    useEffect(() => {
        fetchRanking();
        // Time reduced to 5s
        const interval = setInterval(fetchRanking, 5000);
        return () => clearInterval(interval);
    }, []);
    const fetchRanking = async () => {
        try {
            // Cache busting param - Clean syntax
            const response = await axios.get(`/api/public/ranking?t=${Date.now()}`);
            if (response.data.success) {
                setRanking(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching ranking:', error);
        } finally {
            setLoading(false);
        }
    };
    if (loading) return <div className="text-center text-gray-500">Cargando resultados...</div>;
    return (
        <>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Top 1 - Destacado */}
                {ranking.length > 0 && (
                    <Card
                        onClick={() => ranking[0].streamUrl && setSelectedVideo(ranking[0])}
                        className="md:col-span-2 border-yellow-500/50 bg-yellow-500/5 overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-transform duration-300 group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="text-9xl">👑</div>
                        </div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center text-4xl font-black text-black shadow-lg shadow-yellow-500/50">
                                1
                            </div>
                            <div>
                                <p className="text-yellow-500 font-bold tracking-widest uppercase text-sm mb-1">Liderando la tabla</p>
                                <h3 className="text-3xl font-black text-white mb-1">
                                    {ranking[0].instagram} <span className="text-yellow-500/60 font-medium text-xl ml-2">{ranking[0].alias}</span>
                                </h3>
                                {/* Conditional Score Display */}
                                {!ranking[0].hiddenScore && (
                                    <p className="text-2xl font-bold flex items-center gap-2 text-gray-400">
                                        {ranking[0].isLikes ? (
                                            <span className="text-pink-500">{ranking[0].score} Likes ❤️</span>
                                        ) : (
                                            <span>{ranking[0].score.toFixed(1)} pts</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                    </Card>
                )}
                {/* Resto del Top 5 */}
                {ranking.slice(1, 5).map((entry) => (
                    <div
                        key={entry.id}
                        onClick={() => entry.streamUrl && setSelectedVideo(entry)}
                        className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:bg-white/10 hover:border-brand-purple/50 transition-all active:scale-95"
                    >
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-white">
                            {entry.position}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-white">
                                {entry.instagram} <span className="text-gray-400 font-normal text-sm ml-2">{entry.alias}</span>
                            </h4>
                            {/* Conditional Score Display */}
                            {!entry.hiddenScore && (
                                <p className="font-bold flex items-center gap-2">
                                    {entry.isLikes ? (
                                        <span className="text-pink-500">{entry.score} Likes ❤️</span>
                                    ) : (
                                        <span className="text-brand-purple">{entry.score.toFixed(1)} pts</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                {ranking.length === 0 && (
                    <div className="md:col-span-2 text-center py-12 text-gray-500">
                        Aún no hay videos en el Ranking Público.
                    </div>
                )}
            </div>
            {/* KIOSKO PLAYER MODAL */}
            {selectedVideo && selectedVideo.streamUrl && (
                <KioskoVideoPlayer
                    videoUrl={selectedVideo.streamUrl}
                    alias={selectedVideo.alias}
                    instagram={selectedVideo.instagram}
                    position={selectedVideo.position}
                    score={selectedVideo.score}
                    isLikes={selectedVideo.isLikes}
                    onClose={() => setSelectedVideo(null)}
                />
            )}
        </>
    );
}
EOF

# 3. package.json
cat << 'EOF' > package.json
{
  "name": "santa3d-contest",
  "version": "1.0.0",
  "description": "Plataforma para el Concurso Santa 3D Venezolano - @centauroads",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:seed": "prisma db seed",
    "prisma:studio": "prisma studio",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.956.0",
    "@aws-sdk/s3-request-presigner": "^3.956.0",
    "@hookform/resolvers": "^3.9.1",
    "@prisma/config": "^7.2.0",
    "@sendgrid/mail": "^8.1.6",
    "@types/nodemailer": "^7.0.4",
    "@types/uuid": "^10.0.0",
    "axios": "^1.13.2",
    "bcryptjs": "^2.4.3",
    "canvas": "^3.2.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "dotenv": "^17.2.3",
    "formidable": "^3.5.4",
    "googleapis": "^169.0.0",
    "html2canvas": "^1.4.1",
    "jose": "^5.9.6",
    "jspdf": "^3.0.4",
    "jspdf-autotable": "^5.0.2",
    "lucide-react": "^0.562.0",
    "next": "^14.2.35",
    "node-cron": "^4.2.1",
    "nodemailer": "^7.0.12",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-dropzone": "^14.3.5",
    "react-hook-form": "^7.54.2",
    "resend": "^4.0.1",
    "tailwindcss": "^3.4.17",
    "uuid": "^13.0.0",
    "zod": "^3.23.8",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "@prisma/client": "^6.19.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "^16.1.0",
    "jest": "^29.7.0",
    "postcss": "^8.4.49",
    "prettier": "^3.4.2",
    "prisma": "^6.19.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
EOF
