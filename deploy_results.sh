#!/bin/bash

echo "🚀 Starting Deployment: Results Grid & Instagram Fixes..."

mkdir -p scripts/lib
mkdir -p app/api/admin/instagram/publish

echo "📦 Updating scripts/lib/instagram-publisher.js..."
cat << 'EOF' > scripts/lib/instagram-publisher.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Publishes an image to Instagram (Story or Feed)
 * @param {Buffer} imageBuffer - The image data
 * @param {string} caption - Caption text (only for Feed)
 * @param {string} type - 'STORIES' or 'IMAGE' (Feed)
 * @param {Object} config - Configuration object (accessToken, userId, publicDir, publicUrlBase)
 */
async function publishToInstagram(imageBuffer, caption, type = 'IMAGE', config) {
    try {
        if (!config.accessToken || !config.userId) {
            throw new Error('Missing Instagram Credentials (accessToken or userId)');
        }

        // Ensure temp directory exists
        if (!fs.existsSync(config.publicDir)) {
            fs.mkdirSync(config.publicDir, { recursive: true });
        }

        // 1. Save Image Temporarily (Publicly Accessible)
        const filename = `ig-${type.toLowerCase()}-${Date.now()}.png`;
        const localPath = path.join(config.publicDir, filename);
        const publicUrl = `${config.publicUrlBase}/${filename}`;

        fs.writeFileSync(localPath, imageBuffer);
        console.log(`   📂 Saved temp image: ${localPath}`);
        console.log(`   🌐 Public URL: ${publicUrl}`);

        // Data for Container Creation
        const containerParams = {
            image_url: publicUrl,
            access_token: config.accessToken,
            is_carousel_item: false
        };

        if (type === 'IMAGE') {
            containerParams.caption = caption;
        } else if (type === 'STORIES') {
            containerParams.media_type = 'STORIES';
        }

        // 2. Create Media Container
        console.log(`   ⏳ Creating ${type} container...`);
        const containerUrl = `https://graph.facebook.com/v18.0/${config.userId}/media`;
        const containerRes = await axios.post(containerUrl, null, { params: containerParams });
        const creationId = containerRes.data.id;

        if (!creationId) throw new Error('No creation ID returned');
        console.log(`   ✅ Container Created ID: ${creationId}`);

        // Wait 5 seconds for Instagram to process the image
        // NOTE: In a route handler, this 5s delay is painful but necessary for the API.
        await new Promise(r => setTimeout(r, 8000)); // Increased to 8s for safety

        // 3. Publish Media
        console.log(`   🚀 Publishing...`);
        const publishUrl = `https://graph.facebook.com/v18.0/${config.userId}/media_publish`;
        const publishRes = await axios.post(publishUrl, null, {
            params: {
                creation_id: creationId,
                access_token: config.accessToken
            }
        });

        console.log(`   🎉 Published Successfully! Media ID: ${publishRes.data.id}`);

        // Cleanup: Delete temp file after a delay (e.g., 1 min)
        // We don't await this
        setTimeout(() => {
            if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        }, 60000);

        return { success: true, id: publishRes.data.id, log: `Published ${type} ID: ${publishRes.data.id}` };

    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('   ❌ Publishing Failed:', errorMsg);
        throw new Error(`Instagram API Error: ${errorMsg}`);
    }
}

module.exports = { publishToInstagram };
EOF

echo "📦 Updating app/api/admin/instagram/publish/route.ts..."
cat << 'EOF' > app/api/admin/instagram/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
// @ts-ignore
import { publishToInstagram } from '@/scripts/lib/instagram-publisher';
// @ts-ignore
import { generateStoryImage, generateFeedImage } from '@/scripts/lib/instagram-image-generator';
// @ts-ignore
import { generateInstagramCaption } from '@/scripts/lib/instagram-caption-generator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type } = body; // 'STORY' or 'FEED'

        if (!type) return NextResponse.json({ success: false, error: 'Type required' }, { status: 400 });

        // 1. Fetch Config
        const configDb = await prisma.instagramConfig.findFirst();

        // Construct CONFIG object compatible with generators
        const CONFIG = {
            accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
            userId: process.env.INSTAGRAM_USER_ID,
            publicDir: path.join(process.cwd(), 'public/temp-ig'),
            publicUrlBase: 'http://167.172.217.151/temp-ig',
            timerFormat: configDb?.timerFormat || 'd-h',
            // Color/Design configs
            designMode: configDb?.designMode || 'auto',
            customStoryBg: configDb?.customStoryBg,
            customFeedBg: configDb?.customFeedBg,
            participationMsgs: configDb?.participationMsgs ? JSON.parse(configDb.participationMsgs) : [],
            votingMsgs: configDb?.votingMsgs ? JSON.parse(configDb.votingMsgs) : []
        };

        // Ensure tokens exist
        if (!CONFIG.accessToken || !CONFIG.userId) {
            console.error('Missing Instagram Credentials');
            return NextResponse.json({ success: false, error: 'Server missing Instagram credentials' }, { status: 500 });
        }

        // 2. Fetch Stats & Ranking (Manual construction to ensure flat structure for generators)
        const totalParticipants = await prisma.participant.count();
        const totalVideos = await prisma.video.count({ where: { status: 'VALIDATED' } });
        const totalLikesResult = await prisma.video.aggregate({ _sum: { likes: true }, where: { status: 'VALIDATED' } });
        const totalLikes = totalLikesResult._sum.likes || 0;

        // Time logic - Fetch deadline from settings or hardcode
        const submissionDeadlineSetting = await prisma.contestSetting.findUnique({ where: { key: 'submission_deadline' } });
        const deadline = submissionDeadlineSetting ? new Date(submissionDeadlineSetting.value) : new Date('2025-12-30T23:59:59');
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        // Rankings for Caption/Image
        const topVideos = await prisma.video.findMany({
            where: { status: 'VALIDATED' },
            orderBy: { likes: 'desc' },
            take: 3,
            include: { participant: true }
        });

        const recentParticipants = topVideos.map((v: any) => ({
            name: v.participant.fullName || v.participant.instagram || 'Participante',
            instagram: v.participant.instagram,
            likes: v.likes,
            score: v.likes
        }));

        // FLAT STATS STRUCTURE (Critical for Generators)
        const stats = {
            participants: totalParticipants,
            videos: totalVideos,
            likes: totalLikes,
            timeLeft: {
                days: Math.max(0, days),
                hours: Math.max(0, hours),
                minutes: Math.max(0, minutes),
                isClosed: diff <= 0
            },
            instagramUsers: [],
            recentParticipants: recentParticipants,
            topRanked: recentParticipants
        };

        // 3. Generate & Publish
        let buffer;
        let caption = '';
        let result;

        console.log(`Generating content for ${type}...`);

        if (type === 'STORY') {
            buffer = await generateStoryImage(stats, CONFIG);
            result = await publishToInstagram(buffer, '', 'STORIES', CONFIG);
        } else {
            buffer = await generateFeedImage(stats, CONFIG);
            // Construct data specifically for caption generator
            const captionData = { ...stats, recentParticipants };
            try {
                caption = generateInstagramCaption(captionData);
            } catch (err: any) {
                console.error('Caption Generation Failed:', err);
                caption = 'Concurso Santa 3D Venezolano - ¡Participa!'; // Fallback
            }
            result = await publishToInstagram(buffer, caption, 'IMAGE', CONFIG);
        }

        return NextResponse.json({ success: true, output: result.log, id: result.id });

    } catch (error: any) {
        console.error('Publish API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
    }
}
EOF

echo "📦 Updating scripts/instagram-auto-updater.js..."
cat << 'EOF' > scripts/instagram-auto-updater.js
// scripts/instagram-auto-updater.js
// Automating Instagram Stories & Posts for Santa 3D Contest
// Uses: Content Publishing API (Container based)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const { generateStoryImage, generateFeedImage, fetchContestStats } = require('../lib/instagram-image-generator');
const { generateInstagramCaption } = require('../lib/instagram-caption-generator');
const { publishToInstagram } = require('../lib/instagram-publisher');

// ============================================
// CONFIGURATION
// ============================================

// --- CONFIGURATION ---
const API_URL = process.env.CONTEST_API_URL || 'http://localhost:3000/api/instagram/stats'; // Base URL
const CONFIG_API_URL = API_URL.replace('/stats', '/config'); // Infer config URL

// Default Config (fallback)
let CONFIG = {
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  userId: process.env.INSTAGRAM_USER_ID,
  apiUrl: API_URL, // Use the derived API_URL
  storyHours: (process.env.STORY_SCHEDULE_HOURS || '8,20').split(',').map(h => parseInt(h.trim())),
  feedHours: (process.env.POST_SCHEDULE_HOURS || '12').split(',').map(h => parseInt(h.trim())),
  participationMsgs: [],
  votingMsgs: [],
  restrictToOfficialGrid: true,
  publicDir: path.join(__dirname, '../../public/temp-ig'), // Where to save images
  publicUrlBase: 'http://167.172.217.151/temp-ig',         // URL for Instagram to fetch from
  timerFormat: 'd-h' // Default
};

async function loadRemoteConfig() {
  try {
    console.log(`[Config] Fetching from ${CONFIG_API_URL}...`);
    const res = await axios.get(CONFIG_API_URL);
    const data = res.data;

    if (data.storyHours) {
      CONFIG.storyHours = data.storyHours.split(',').map(h => parseInt(h.split(':')[0]));
    }
    if (data.feedHours) {
      CONFIG.feedHours = data.feedHours.split(',').map(h => parseInt(h.split(':')[0]));
    }

    // Parse messages
    try { CONFIG.participationMsgs = JSON.parse(data.participationMsgs); } catch (e) { console.warn('[Config] Failed to parse participationMsgs:', e.message); }
    try { CONFIG.votingMsgs = JSON.parse(data.votingMsgs); } catch (e) { console.warn('[Config] Failed to parse votingMsgs:', e.message); }

    CONFIG.restrictToOfficialGrid = data.restrictToOfficialGrid;
    if (data.timerFormat) CONFIG.timerFormat = data.timerFormat;

    console.log('[Config] Loaded successfully:', CONFIG);
  } catch (e) {
    console.error('[Config] Failed to load remote config, using defaults.', e.message);
  }
}


// Ensure temp directory exists
if (!fs.existsSync(CONFIG.publicDir)) {
  fs.mkdirSync(CONFIG.publicDir, { recursive: true });
}

// ============================================
// CORE FUNCTIONS
// ============================================

async function runUpdate(type = 'FEED') {
  console.log(`\n============== STARTING ${type} UPDATE ==============`);
  try {
    // 1. Fetch Stats
    const stats = await fetchContestStats(CONFIG.apiUrl);
    console.log(`   📊 Stats: ${stats.participants} participants, ${stats.timeLeft.days} days left`);

    // 2. Generate Image & Publish
    await loadRemoteConfig(); // Ensure we have latest config before running
    if (type === 'STORY') {
      const buffer = await generateStoryImage(stats, CONFIG);
      await publishToInstagram(buffer, '', 'STORIES', CONFIG);
    } else {
      const buffer = await generateFeedImage(stats, CONFIG);
      // Generate Caption
      const captionData = {
        ...stats,
        recentParticipants: stats.recentParticipants || []
      };
      // Mocking caption generator call if needed or reusing lib
      const caption = generateInstagramCaption(captionData);
      await publishToInstagram(buffer, caption, 'IMAGE', CONFIG);
    }

  } catch (error) {
    console.error('   ❌ Job Failed:', error.message);
  }
}

// ============================================
// SCHEDULER
// ============================================

console.log('🤖 Instagram Auto-Updater Started');
console.log(`   POST Schedule (Hours): ${CONFIG.feedHours.join(', ')}`);
console.log(`   STORY Schedule (Hours): ${CONFIG.storyHours.join(', ')}`);

// Schedule Feed Posts
CONFIG.feedHours.forEach(hour => {
  cron.schedule(`0 ${hour} * * *`, () => {
    runUpdate('FEED');
  }, { timezone: "America/Caracas" });
  console.log(`   📅 Scheduled Feed Post at ${hour}:00 VET`);
});

// Schedule Stories
CONFIG.storyHours.forEach(hour => {
  cron.schedule(`0 ${hour} * * *`, () => {
    runUpdate('STORY');
  }, { timezone: "America/Caracas" });
  console.log(`   📅 Scheduled Story at ${hour}:00 VET`);
});

// Manual Run Detection (npm run manual)
if (process.argv.includes('--manual')) {
  console.log('   🧪 Manual Trigger Detected');
  (async () => {
    // Check for type arg
    const type = process.argv.includes('--feed') ? 'FEED' : 'STORY';
    await runUpdate(type);
  })();
}
EOF

echo "📦 Updating app/api/admin/results/route.ts..."
cat << 'EOF' > app/api/admin/results/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Authenticate as Admin
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get total number of judges to calculate pending votes
        const totalJudges = await prisma.judge.count();

        const videos = await prisma.video.findMany({
            where: { status: 'VALIDATED' },
            include: {
                participant: true,
                evaluations: {
                    include: {
                        judge: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true
                            }
                        },
                        criterionScores: {
                            include: {
                                criterion: true
                            }
                        }
                    }
                }
            }
        });

        const results = videos.map(video => {
            const voteCount = video.evaluations.length;
            const pendingCount = totalJudges - voteCount;
            const totalScoreSum = video.evaluations.reduce((acc, curr) => acc + curr.puntajeTotal, 0);
            const averageScore = voteCount > 0 ? (totalScoreSum / voteCount) : 0;

            return {
                id: video.id,
                thumbnail: video.url,
                participantName: `${video.participant.nombre} ${video.participant.apellido}`,
                alias: video.participant.alias,
                email: video.participant.email,
                instagram: video.participant.instagram,

                // Tech Specs
                resolution: video.resolution,
                fps: video.fps,
                duration: video.duration,
                format: video.format,

                uploadedAt: video.uploadedAt,

                // Likes Data
                instagramLikes: video.instagramLikes,
                closingLikes: video.closingLikes,
                closingLikesAt: video.closingLikesAt,

                // Metrics
                voteCount,
                pendingCount: pendingCount < 0 ? 0 : pendingCount,
                totalScoreSum,
                averageScore,

                isJudgeSelected: video.isJudgeSelected,

                // Detailed Evaluations
                evaluations: video.evaluations.map(ev => ({
                    judgeName: `${ev.judge.nombre} ${ev.judge.apellido || ''}`,
                    score: ev.puntajeTotal,
                    comments: ev.observacionesGenerales || 'Sin comentarios',
                    evaluatedAt: ev.evaluatedAt,
                    criterionScores: ev.criterionScores.map(cs => ({
                        name: cs.criterion.nombre,
                        weight: cs.criterion.peso,
                        score: cs.puntaje
                    })).sort((a, b) => a.name.localeCompare(b.name))
                }))
            };
        });

        // Sort by Average Score Descending
        results.sort((a, b) => b.averageScore - a.averageScore);

        return NextResponse.json({ success: true, data: results });

    } catch (error) {
        console.error('Admin results error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
EOF

echo "📦 Updating app/admin/resultados/page.tsx..."
cat << 'EOF' > app/admin/resultados/page.tsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronRight, Search, FileVideo, UserCheck, Calculator, Instagram } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import Input from '@/components/ui/Input';

interface CriterionDetail {
    name: string;
    weight: number;
    score: number;
}
interface EvaluationDetail {
    judgeName: string;
    score: number;
    comments: string;
    evaluatedAt: string;
    criterionScores: CriterionDetail[];
}
interface ResultRow {
    id: string;
    thumbnail: string | null;
    participantName: string;
    alias: string;
    email: string;
    instagram: string;
    uploadedAt: string;
    format: string;

    // Tech Specs
    resolution?: string;
    fps?: number | string;
    duration?: number | string;

    // Likes
    instagramLikes: number;
    closingLikes?: number;
    closingLikesAt?: string;

    voteCount: number;
    pendingCount: number;
    totalScoreSum: number;
    averageScore: number;
    evaluations: EvaluationDetail[];
    isJudgeSelected: boolean;
}

export default function AdminResultsPage() {
    const [results, setResults] = useState<ResultRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/results', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setResults(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRows(newSet);
    };

    const handleToggleJudge = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = !currentStatus;
        // Optimistic update
        setResults(prev => prev.map(r =>
            r.id === id ? { ...r, isJudgeSelected: newStatus } : r
        ));
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post('/api/admin/videos/toggle-judge', {
                videoId: id,
                isSelected: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.data.success) {
                // Revert on failure
                alert('Error: ' + res.data.error);
                setResults(prev => prev.map(r =>
                    r.id === id ? { ...r, isJudgeSelected: currentStatus } : r
                ));
            }
        } catch (error: any) {
            console.error(error);
            alert('Error de conexión');
            setResults(prev => prev.map(r =>
                r.id === id ? { ...r, isJudgeSelected: currentStatus } : r
            ));
        }
    };

    const formatDuration = (val: number | string | undefined) => {
        if (!val) return '-';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '-';
        const mins = Math.floor(num / 60);
        const secs = Math.floor(num % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimeDiff = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMins = Math.abs(differenceInMinutes(endDate, startDate));
        const diffHours = Math.abs(differenceInHours(endDate, startDate));
        const diffDays = Math.abs(differenceInDays(endDate, startDate));
        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
        return `${diffMins} min`;
    };

    const filteredResults = results.filter(r =>
        r.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Latest Closing Date
    const latestClosingDate = results.reduce((latest, current) => {
        if (!current.closingLikesAt) return latest;
        const currentDate = new Date(current.closingLikesAt);
        if (!latest || currentDate > new Date(latest)) return current.closingLikesAt;
        return latest;
    }, null as string | null);

    if (loading) return <div className="text-center p-10 text-gray-500">Cargando resultados...</div>;

    return (
        <div className="space-y-6">
            {/* VIDEO MODAL OVERLAY */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div
                        className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="bg-black/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                            >
                                <span className="sr-only">Cerrar</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <video
                            src={selectedVideo}
                            controls
                            autoPlay
                            className="w-full h-auto max-h-[80vh]"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tablero de Control de Resultados</h1>
                    {latestClosingDate && (
                        <div className="text-xs text-brand-purple mt-1 font-medium bg-purple-50 px-2 py-1 rounded inline-block border border-purple-100">
                            📅 Fecha Likes Cierre: <span className="font-bold">{format(new Date(latestClosingDate), 'dd/MM/yyyy HH:mm:ss')}</span>
                        </div>
                    )}
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                        placeholder="Buscar participante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-4 text-center w-20">Jueces</th>
                                <th className="px-6 py-4">Identificación</th>

                                {/* New Columns: Tech Specs (Order from Video Module) */}
                                <th className="px-4 py-3 text-center">
                                    <div className="flex flex-col">
                                        <span>RES</span>
                                        <span className="text-[9px] text-gray-400 font-normal">1024x1792</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center">
                                    <div className="flex flex-col">
                                        <span>FPS</span>
                                        <span className="text-[9px] text-gray-400 font-normal">30 o+</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center">
                                    <div className="flex flex-col">
                                        <span>DUR</span>
                                        <span className="text-[9px] text-gray-400 font-normal">15-20s</span>
                                    </div>
                                </th>

                                <th className="px-6 py-4">Fechas</th>
                                <th className="px-6 py-4 text-center">Tiempo</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center text-pink-600">Likes</th>
                                <th className="px-6 py-4 text-center text-purple-600">Likes Cierre</th>
                                <th className="px-6 py-4 text-center text-orange-600">Pendientes</th>
                                <th className="px-6 py-4 text-center text-blue-600">Votos</th>
                                <th className="px-6 py-4 text-right bg-gray-100/50">Total</th>
                                <th className="px-6 py-4 text-right">Promedio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredResults.map((row) => {
                                // Validation Logic (Same as Video Module)
                                const isResOk = row.resolution === '1024x1792';
                                const fpsVal = typeof row.fps === 'string' ? parseFloat(row.fps) : row.fps;
                                const isFpsOk = fpsVal && fpsVal >= 30;
                                const durVal = typeof row.duration === 'string' ? parseFloat(row.duration) : row.duration;
                                const isDurOk = durVal && durVal >= 15 && durVal <= 20;
                                const okClass = 'text-green-600 font-bold';
                                const errClass = 'text-red-500 font-bold';

                                return (
                                    <tr key={row.id}>
                                        <tr className="hover:bg-gray-50/50 transition-colors w-full contents">
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => handleToggleJudge(row.id, row.isJudgeSelected, e)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${row.isJudgeSelected ? 'bg-purple-600' : 'bg-gray-200'}`}
                                                    title={row.isJudgeSelected ? 'Visible para Jueces' : 'Oculto para Jueces'}
                                                >
                                                    <span className={`${row.isJudgeSelected ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        onClick={() => row.thumbnail && setSelectedVideo(row.thumbnail)}
                                                        className={`w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden relative ${row.thumbnail ? 'cursor-pointer hover:ring-2 hover:ring-purple-400 hover:shadow-md transition-all' : ''}`}
                                                        title={row.thumbnail ? "Ver Video" : "Sin Video"}
                                                    >
                                                        {row.thumbnail ? (
                                                            <video
                                                                src={row.thumbnail}
                                                                className="w-full h-full object-cover pointer-events-none"
                                                                muted
                                                                playsInline
                                                            // Optional: poster can be added if available
                                                            />
                                                        ) : (
                                                            <FileVideo size={20} />
                                                        )}
                                                        {row.thumbnail && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/0 transition-colors"></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{row.participantName}</div>
                                                        <div className="text-xs text-brand-purple">{row.alias}</div>
                                                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <Instagram size={10} />
                                                            {row.instagram}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Resolution */}
                                            <td className={`px-4 py-3 text-center font-mono text-xs ${isResOk ? okClass : errClass}`}>
                                                {row.resolution || '-'}
                                            </td>
                                            {/* FPS */}
                                            <td className={`px-4 py-3 text-center font-mono text-xs ${isFpsOk ? okClass : errClass}`}>
                                                {row.fps || '-'}
                                            </td>
                                            {/* Duration */}
                                            <td className={`px-4 py-3 text-center font-mono text-xs ${isDurOk ? okClass : errClass}`}>
                                                {formatDuration(row.duration)}
                                            </td>

                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                <div className="text-xs space-y-1">
                                                    <div>
                                                        <span className="text-gray-400 font-medium">Subido:</span> <span className="font-bold text-gray-900">{format(new Date(row.uploadedAt), 'dd/MM HH:mm')}</span>
                                                    </div>
                                                    {row.evaluations.length > 0 && (
                                                        <div>
                                                            <span className="text-brand-purple font-medium">Evaluado:</span> <span className="font-bold text-gray-900">
                                                                {format(new Date(Math.max(...row.evaluations.map(e => new Date(e.evaluatedAt).getTime()))), 'dd/MM HH:mm')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">
                                                {row.evaluations.length > 0 ? (
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-bold">
                                                        {formatTimeDiff(
                                                            row.uploadedAt,
                                                            new Date(Math.max(...row.evaluations.map(e => new Date(e.evaluatedAt).getTime()))).toISOString()
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                    VALIDADO
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-pink-600">
                                                    {row.instagramLikes}
                                                </span>
                                            </td>
                                            {/* Closing Likes */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-purple-600">
                                                    {row.closingLikes || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.pendingCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                                                    {row.pendingCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center cursor-pointer group" onClick={() => toggleRow(row.id)}>
                                                <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors">
                                                    <UserCheck size={14} />
                                                    <span className="font-bold">{row.voteCount}</span>
                                                    {expandedRows.has(row.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </div>
                                                <span className="block text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Ver detalles</span>
                                            </td>
                                            <td className="px-6 py-4 text-right bg-blue-50/30">
                                                <span className="text-gray-900 font-bold">{row.totalScoreSum ? row.totalScoreSum.toFixed(1) : '0.0'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xl font-black text-gray-900">{row.averageScore.toFixed(1)}</span>
                                            </td>
                                        </tr>
                                        {/* Expanded Details Sub-Table */}
                                        {expandedRows.has(row.id) && (
                                            <tr className="bg-gray-50 border-b border-gray-200 shadow-inner">
                                                <td colSpan={15} className="p-0">
                                                    <div className="p-6">
                                                        <div className="bg-white border boundary-gray-200 rounded-lg shadow-sm overflow-hidden">
                                                            <h4 className="text-xs font-bold uppercase text-gray-500 p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                                                <Calculator size={14} />
                                                                Desglose de Calificaciones
                                                            </h4>
                                                            {row.evaluations.length > 0 ? (
                                                                <table className="w-full text-sm">
                                                                    <thead className="bg-gray-800 text-white font-black uppercase border-b border-gray-700">
                                                                        {/* Row 1: Weights */}
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left border-r border-gray-700 w-48"></th>
                                                                            {row.evaluations[0].criterionScores.map((c, idx) => (
                                                                                <th key={idx} className="px-4 py-2 text-center border-r border-gray-600">
                                                                                    <span className="text-xl font-black text-yellow-400">{c.weight}%</span>
                                                                                </th>
                                                                            ))}
                                                                            <th className="px-4 py-2 text-right"></th>
                                                                        </tr>
                                                                        {/* Row 2: Names */}
                                                                        <tr className="bg-gray-900/50 text-gray-300 text-xs">
                                                                            <th className="px-4 py-2 text-left border-r border-gray-700">Juez</th>
                                                                            {row.evaluations[0].criterionScores.map((c, idx) => (
                                                                                <th key={idx} className="px-4 py-2 text-center font-medium border-r border-gray-700">
                                                                                    {c.name}
                                                                                </th>
                                                                            ))}
                                                                            <th className="px-4 py-2 text-right border-l border-gray-700 bg-gray-800">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                                                        {row.evaluations.map((ev, i) => (
                                                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                                                {/* Judge Name and Comments */}
                                                                                <td className="px-4 py-3 border-r border-gray-100 align-top">
                                                                                    <div className="font-bold text-gray-900">{ev.judgeName}</div>
                                                                                    {ev.comments && ev.comments !== 'Sin comentarios' ? (
                                                                                        <div className="group relative mt-1 inline-block">
                                                                                            <span className="cursor-help text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20 hover:bg-brand-purple hover:text-white transition-all">
                                                                                                Con comentarios
                                                                                            </span>
                                                                                            <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left pointer-events-none">
                                                                                                <div className="font-bold mb-1 text-gray-300 border-b border-gray-700 pb-1">Observaciones</div>
                                                                                                <p className="leading-relaxed whitespace-normal">{ev.comments}</p>
                                                                                                <div className="absolute left-4 bottom-full border-8 border-transparent border-b-gray-900"></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-[10px] text-gray-400 font-medium mt-1">
                                                                                            Sin comentarios
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                {/* Scores */}
                                                                                {ev.criterionScores.map((score, sIdx) => (
                                                                                    <td key={sIdx} className="px-4 py-3 text-center text-gray-600 font-medium border-r border-gray-100 align-top pt-4">
                                                                                        {score.score.toFixed(1)}
                                                                                    </td>
                                                                                ))}
                                                                                {/* Total */}
                                                                                <td className="px-4 py-3 text-right font-black text-brand-purple bg-brand-purple/5 border-l border-brand-purple/10 align-top pt-4">
                                                                                    {ev.score.toFixed(1)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                        <tr className="bg-gray-100 font-black text-gray-900 border-t border-gray-300">
                                                                            <td className="px-4 py-2 text-right uppercase tracking-widest text-xs border-r border-gray-200">
                                                                                Totales:
                                                                            </td>
                                                                            {row.evaluations[0].criterionScores.map((c, idx) => (
                                                                                <td key={idx} className="px-4 py-2 text-center text-gray-300 text-xs border-r border-gray-200">-</td>
                                                                            ))}
                                                                            <td className="px-4 py-2 text-right text-base text-blue-600 bg-blue-50 border-l border-blue-100">
                                                                                {row.totalScoreSum ? row.totalScoreSum.toFixed(1) : '0.0'}
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            ) : (
                                                                <div className="p-8 text-center text-gray-400 italic">
                                                                    No hay votos registrados para generar el desglose.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tr>
                                )
                            })}
                            {filteredResults.length === 0 && (
                                <tr>
                                    <td colSpan={15} className="text-center py-12 text-gray-400">
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
EOF

echo "🔄 Installing dependencies (if needed)..."
# npm install 

echo "🏗️  Building Next.js application..."
npm run build

echo "♻️  Restarting PM2 process..."
pm2 restart all

echo "✅ Deployment Complete! Verify at /admin/resultados"
