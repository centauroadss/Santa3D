#!/bin/bash

echo "Starting deployment of Instagram fixes..."

echo "Updating prisma/schema.prisma..."
cat << 'EOF' > prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
model Participant {
  id               String    @id @default(cuid())
  nombre           String
  apellido         String
  alias            String
  email            String    @unique
  telefono         String
  instagram        String
  fechaNacimiento  DateTime
  edad             Int       @default(0)
  aceptaTerminos   Boolean   @default(false)
  sigueCuenta      Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  video            Video?
  @@index([email])
  @@map("participants")
}
enum VideoStatus {
  PENDING_UPLOAD
  PENDING_VALIDATION
  VALIDATED
  REJECTED
}
model Video {
  id                 String      @id @default(cuid())
  participantId      String      @unique
  fileName           String
  storageKey         String
  url                String?     @db.Text
  format             String?
  fileSize           Int
  fps                Int?        
  
  // CAMPOS DE PRODUCCIÓN (RECUPERADOS)
  closingLikes       Int?
  closingLikesAt     DateTime?   // NUEVO: Agregado para soportar likes-closing
  duration           Float?
  isJudgeSelected    Boolean     @default(false)
  resolution         String?
  status             VideoStatus @default(PENDING_UPLOAD)
  validationResult   Json?
  rejectionReason    String?
  uploadedAt         DateTime    @default(now())
  validatedAt        DateTime?
  instagramUrl       String?
  instagramLikes     Int         @default(0)
  lastInstagramSync  DateTime?
  participant        Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  evaluations        Evaluation[]
  @@index([participantId])
  @@index([status])
  @@map("videos")
}
model Judge {
  id          String       @id @default(cuid())
  nombre      String
  apellido    String?
  profesion   String?
  biografia   String?      @db.Text
  fotoUrl     String?      @db.Text
  email       String       @unique
  telefono    String?
  instagram   String?
  password    String?
  role        String       @default("JUDGE")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @default(now()) @updatedAt
  isDefaultPassword Boolean @default(true)
  resetRequested    Boolean @default(false)
  evaluations Evaluation[]
  @@index([email])
  @@map("judges")
}
model AuditLog {
  id          String   @id @default(cuid())
  action      String
  severity    String   @default("INFO")
  issuer      String?
  ipAddress   String?
  userAgent   String?
  targetId    String?
  targetEmail String?
  targetName  String?
  details     String?
  createdAt   DateTime @default(now())
  @@index([action])
  @@index([severity])
  @@map("audit_logs")
}
model EvaluationCriterion {
  id            String           @id @default(cuid())
  nombre        String
  descripcion   String?
  peso          Float
  puntajeMaximo Float            @default(20.0)
  orden         Int
  createdAt     DateTime         @default(now())
  criterionScores CriterionScore[]
  @@index([orden])
  @@map("evaluation_criteria")
}
model Evaluation {
  id                      String   @id @default(cuid())
  videoId                 String
  judgeId                 String
  observacionesGenerales  String?
  puntajeTotal            Float
  evaluatedAt             DateTime @default(now())
  video                   Video             @relation(fields: [videoId], references: [id], onDelete: Cascade)
  judge                   Judge             @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  criterionScores         CriterionScore[]
  @@unique([videoId, judgeId])
  @@index([videoId])
  @@index([judgeId])
  @@map("evaluations")
}
model CriterionScore {
  id            String              @id @default(cuid())
  evaluationId  String
  criterionId   String
  puntaje       Float
  observaciones String?
  evaluation    Evaluation          @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  criterion     EvaluationCriterion @relation(fields: [criterionId], references: [id], onDelete: Cascade)
  @@unique([evaluationId, criterionId])
  @@index([evaluationId])
  @@map("criterion_scores")
}
model Admin {
  id        String   @id @default(cuid())
  nombre    String
  email     String   @unique
  password  String
  role      String   @default("ADMIN")
  createdAt DateTime @default(now())
  @@index([email])
  @@map("admins")
}
model ContestSetting {
  id                  String   @id @default(cuid())
  key                 String   @unique
  value               String
  updatedAt           DateTime @updatedAt
  @@map("contest_settings")
}

model InstagramConfig {
  id                      Int      @id @default(autoincrement())
  storyHours              String   @default("08:00,20:00")
  feedHours               String   @default("12:00")
  participationMsgs       String   @db.Text
  votingMsgs              String   @db.Text
  restrictToOfficialGrid  Boolean  @default(true)
  designMode              String   @default("auto") // "auto" | "custom"
  customStoryBg           String?  @db.Text
  customFeedBg            String?  @db.Text
  timerFormat             String?  @default("d-h")
  updatedAt               DateTime @updatedAt
  
  @@map("instagram_configs")
}
EOF

echo "Updating app/api/admin/instagram/config/route.ts..."
cat << 'EOF' > app/api/admin/instagram/config/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust import path if necessary based on project structure
// import { getUserFromSession } from '@/lib/auth';

export async function GET() {
    try {
        // 1. Auth Check (Optional but recommended)
        // const user = await getUserFromSession();
        // if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Fetch Config
        let config = await prisma.instagramConfig.findFirst();

        // 3. Create Default if not exists
        if (!config) {
            config = await prisma.instagramConfig.create({
                data: {
                    storyHours: "08:00,20:00",
                    feedHours: "12:00",
                    participationMsgs: JSON.stringify([
                        "¡$600 USD AL 1er LUGAR! - ¿Vas a dejar pasar la oportunidad?",
                        "¡GANA $600 USD! - Es tu último chance para participar",
                        "¡PREMIOS EN EFECTIVO! - El primer lugar se lleva $600"
                    ]),
                    votingMsgs: JSON.stringify([
                        "¡Tu voto cuenta! - Apoya a tu talento favorito",
                        "¿Ya elegiste tu favorito? - Vota por el mejor Santa 3D",
                        "¡Ayuda a elegir al ganador! - Dale like a los mejores videos"
                    ]),
                    restrictToOfficialGrid: true,
                    designMode: "auto",
                    timerFormat: "d-h"
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching Instagram config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate fields if necessary

        // Upsert (Update or Create)
        // Since we only want one config row, we update the first one or create.
        const first = await prisma.instagramConfig.findFirst();

        let config;
        if (first) {
            config = await prisma.instagramConfig.update({
                where: { id: first.id },
                data: {
                    storyHours: body.storyHours,
                    feedHours: body.feedHours,
                    participationMsgs: JSON.stringify(body.participationMsgs), // Ensure array is stringified
                    votingMsgs: JSON.stringify(body.votingMsgs),
                    restrictToOfficialGrid: body.restrictToOfficialGrid,
                    designMode: body.designMode,
                    customStoryBg: body.customStoryBg,
                    customFeedBg: body.customFeedBg,
                    timerFormat: body.timerFormat
                }
            });
        } else {
            config = await prisma.instagramConfig.create({
                data: {
                    storyHours: body.storyHours,
                    feedHours: body.feedHours,
                    participationMsgs: JSON.stringify(body.participationMsgs),
                    votingMsgs: JSON.stringify(body.votingMsgs),
                    restrictToOfficialGrid: body.restrictToOfficialGrid,
                    designMode: body.designMode,
                    customStoryBg: body.customStoryBg,
                    customFeedBg: body.customFeedBg,
                    timerFormat: body.timerFormat
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error updating Instagram config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
EOF

echo "Updating scripts/lib/instagram-image-generator.js..."
cat << 'EOF' > scripts/lib/instagram-image-generator.js
// lib/instagram-image-generator.js
// Generador de Imagen para Instagram (Stories + Feed) - Concurso Santa 3D

const { createCanvas, registerFont } = require('canvas');
const axios = require('axios');

// ============================================
// CONFIGURACIÓN VISUAL
// ============================================

const COLORS = {
    primary: '#F26522',      // Naranja Centauro (Brand Accent)
    secondary: '#FFD700',    // Dorado (Mantener para premios/lujo)
    text: '#FFFFFF',         // Blanco
    bgFrom: '#2E003E',       // Morado Oscuro (Deep Purple)
    bgTo: '#85439a',         // Morado Corporativo (Lighter Purple for gradient)
    urgent: '#FF4500',       // Rojo naranja de urgencia
    corporate: '#85439a',    // Morado Brand
    accent: '#F26522',       // Naranja Brand
    headerBg: '#4a1d5c'      // Medium Purple for header bar
};

const MOTIVATIONAL_MESSAGES = [
    "¡Estamos ya por cerrar! - Animate, se parte de los valientes",
    "¡Últimos días para participar! - Demuestra tu talento 3D",
    "¡El tiempo se agota! - Únete a los mejores diseñadores",
    "¡Ya casi cerramos! - No te quedes fuera de la historia",
    "¡Faltan pocas horas! - Muestra tu creatividad venezolana",
    "¡Cierra pronto! - Sé parte de los diseñadores élite",
    "¡Última oportunidad! - Demuestra que eres el mejor",
    "¡Se acaba el tiempo! - Animate a crear tu Santa 3D"
];

const PRIZE_MESSAGES = [
    "¡$600 USD AL 1er LUGAR! - ¿Vas a dejar pasar la oportunidad?",
    "¡GANA $600 USD! - Es tu último chance para participar",
    "¡PREMIOS EN EFECTIVO! - El primer lugar se lleva $600",
    "¡TU TALENTO VALE ORO! - Participa por los $600 USD",
    "¡GRAN PREMIO $600! - ¿Tienes lo que se necesita?",
    "¡$600 PARA EL MEJOR! - No dejes que otro se lo lleve"
];

const VOTING_MESSAGES = [
    "¡Tu voto cuenta! - Apoya a tu talento favorito",
    "¿Ya elegiste tu favorito? - Vota por el mejor Santa 3D",
    "¡Ayuda a elegir al ganador! - Dale like a los mejores videos",
    "¡Los jueces observan, tú decides! - Apoya al talento nacional",
    "¡Haz que ganen! - Busca a tu favorito y dale amor",
    "¡Votación abierta! - El público es parte del jurado"
];

// Returns a message object with text and type ('participation' or 'voting')
function getDualMessage(daysLeft) {
    if (daysLeft === 0) return { text: "¡ÚLTIMA OPORTUNIDAD! - Se cierra HOY", type: 'participation' };

    // Simple rotation based on current hour to alternate goals
    const currentHour = new Date().getHours();
    const isVotingTime = currentHour % 2 === 0; // Even hours = Voting, Odd = Participation

    if (isVotingTime) {
        const index = currentHour % VOTING_MESSAGES.length;
        return { text: VOTING_MESSAGES[index], type: 'voting' };
    } else {
        // Mix generic motivation with PRIZE motivation (50/50 Chance or prioritize Prize)
        const showPrize = currentHour % 3 !== 0; // 2/3 chance to show prize msg

        if (daysLeft === 1) return { text: "¡ÚLTIMO DÍA! - Gana $600 USD al 1er Lugar", type: 'participation' };
        if (daysLeft <= 3) return { text: "¡Queda poco tiempo! - $600 USD esperan por ti", type: 'participation' };

        if (showPrize) {
            const index = daysLeft % PRIZE_MESSAGES.length;
            return { text: PRIZE_MESSAGES[index], type: 'participation' };
        } else {
            const index = daysLeft % MOTIVATIONAL_MESSAGES.length;
            return { text: MOTIVATIONAL_MESSAGES[index], type: 'participation' };
        }
    }
}

// ============================================
// UTILS DE DIBUJO
// ============================================

function drawRankingList(ctx, x, y, ranking, width) {
    const boxWidth = width - 100;
    const boxHeight = (ranking.length * 50) + 70;

    // Background Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x - (boxWidth / 2), y, boxWidth, boxHeight);
    ctx.strokeStyle = COLORS.secondary;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - (boxWidth / 2), y, boxWidth, boxHeight);

    // Title
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.secondary;
    ctx.font = 'bold 35px Arial';
    ctx.fillText('🏆 TOP 5 MEJORES VIDEOS', x - (boxWidth / 2) + 40, y + 50);

    // Divider
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x - (boxWidth / 2) + 20, y + 70);
    ctx.lineTo(x + (boxWidth / 2) - 20, y + 70);
    ctx.stroke();

    // List
    let currentY = y + 120;
    ranking.forEach((item, index) => {
        // Name
        ctx.textAlign = 'left';
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 30px Arial';
        const name = item.instagram ? `${item.instagram}` : item.name;
        ctx.fillText(`${index + 1}. ${name}`, x - (boxWidth / 2) + 40, currentY);

        // Likes
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.secondary;
        ctx.fillText(`${item.likes} ❤️`, x + (boxWidth / 2) - 40, currentY);

        currentY += 50;
    });
}

// ============================================
// GENERADOR DE STORY (9:16 - 1080x1920)
// ============================================

async function generateStoryImage(stats, config = {}) {
    const width = 1080;
    const height = 1920;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Fondo (Custom vs Auto)
    if (config.designMode === 'custom' && config.customStoryBg) {
        try {
            const { loadImage } = require('canvas');
            const path = require('path');
            // Resolve local file path
            const relativePath = config.customStoryBg.startsWith('/') ? config.customStoryBg.slice(1) : config.customStoryBg;
            const filePath = path.join(process.cwd(), 'public', relativePath);

            console.log('[Generator] Loading Story BG from:', filePath);
            const bgImage = await loadImage(filePath);
            ctx.drawImage(bgImage, 0, 0, width, height);
        } catch (e) {
            console.error('Error loading custom story bg:', e);
            // Fallback to gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, COLORS.bgFrom);
            gradient.addColorStop(1, COLORS.bgTo);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, COLORS.bgFrom);
        gradient.addColorStop(1, COLORS.bgTo);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Header (Only if Auto)
    if (config.designMode !== 'custom') {
        // Header Bar Background
        ctx.fillStyle = COLORS.headerBg;
        ctx.fillRect(0, 0, width, 220);
        // Accent Line (Orange)
        ctx.fillStyle = COLORS.accent;
        ctx.fillRect(0, 215, width, 5);
        ctx.textAlign = 'center';
        // Title: CONCURSO (Orange)
        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 60px Arial';
        ctx.fillText('CONCURSO', width / 2, 90);
        // Title: SANTA 3D (White)
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 80px Arial';
        ctx.fillText('SANTA 3D', width / 2, 180);
    }

    // 3. Countdown (Centro Gigante)
    // Box with Purple/Orange Border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Darker transparency for contrast
    ctx.fillRect(100, 350, width - 200, 350);
    ctx.strokeStyle = COLORS.accent; // Orange border
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 350, width - 200, 350);

    ctx.fillStyle = COLORS.secondary; // Gold for numbers
    ctx.font = 'bold 200px Arial';

    // LOGIC: Use configured format or fallback to smart default
    const format = config.timerFormat || 'd-h'; // d-h, d, h, h-m
    let mainVal = '';
    let label = '';

    // Calculate total hours for 'h' based formats
    const totalHours = (stats.timeLeft.days * 24) + stats.timeLeft.hours;

    if (format === 'd') {
        const days = stats.timeLeft.days + (stats.timeLeft.hours >= 12 ? 1 : 0); // round up? or just days? let's stick to simple days.
        mainVal = `${stats.timeLeft.days}`;
        label = 'DÍAS RESTANTES';
    } else if (format === 'h') {
        mainVal = `${totalHours}`;
        label = 'HORAS RESTANTES';
    } else if (format === 'h-m') { // simplified for story: just Hours
        mainVal = `${totalHours}`;
        label = 'HORAS RESTANTES';
    } else {
        // d-h (Default Smart)
        if (stats.timeLeft.days == 0) { // LOOSE EQUALITY FIX
            mainVal = `${stats.timeLeft.hours}h`;
            label = 'HORAS RESTANTES';
        } else {
            mainVal = `${stats.timeLeft.days}`;
            label = 'DÍAS RESTANTES';
        }
    }

    ctx.textAlign = 'center';
    ctx.fillText(mainVal, width / 2, 580);


    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 40px Arial';
    ctx.fillText(label, width / 2, 650);


    // 4. Stats Summary
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 80px Arial';
    ctx.fillText(stats.participants.toString(), width / 2, 750);
    ctx.font = '30px Arial';
    ctx.fillText('CONCURSANTES', width / 2, 800);

    // 5. Ranking List (Replaces Total Likes)
    if (stats.topRanked && stats.topRanked.length > 0) {
        drawRankingList(ctx, width / 2, 900, stats.topRanked, width);
    }

    // 6. Motivation (Dynamic Dual Message)
    const messageData = getDualMessage(stats.timeLeft.days);
    const msg = messageData.text;

    ctx.font = 'italic 35px Arial';
    ctx.fillStyle = COLORS.secondary;
    const words = msg.split(' - ');
    ctx.textAlign = 'center';
    ctx.fillText(words[0], width / 2, 1450);
    if (words[1]) ctx.fillText(words[1], width / 2, 1500);

    // 7. Footer (Only if Auto)
    if (config.designMode !== 'custom') {
        ctx.fillStyle = '#FF0000'; // Mockup uses Red for Story Button
        ctx.fillRect(0, 1650, width, height - 1650);
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 60px Arial';

        const ctaText = messageData.type === 'voting' ? '¡VOTA POR TU FAVORITO!' : '¡PARTICIPA YA!';
        ctx.fillText(ctaText, width / 2, 1750);

        ctx.font = '40px Arial';
        ctx.fillText('LINK EN BIO @CENTAUROADS', width / 2, 1820);
    } else {
        // Just text overlay for custom
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 60px Arial';
        const ctaText = messageData.type === 'voting' ? '¡VOTA POR TU FAVORITO!' : '¡PARTICIPA YA!';
        ctx.fillText(ctaText, width / 2, 1750);
    }

    return canvas.toBuffer('image/png');
}

// ============================================
// GENERADOR DE FEED (4:5 - 1080x1350)
// ============================================

async function generateFeedImage(stats, config = {}) {
    const width = 1080;
    const height = 1350;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Fondo
    if (config.designMode === 'custom' && config.customFeedBg) {
        try {
            const { loadImage } = require('canvas');
            const path = require('path');
            // Resolve local file path
            const relativePath = config.customFeedBg.startsWith('/') ? config.customFeedBg.slice(1) : config.customFeedBg;
            const filePath = path.join(process.cwd(), 'public', relativePath);
            console.log('[Generator] Loading Feed BG from:', filePath);
            const bgImage = await loadImage(filePath);
            ctx.drawImage(bgImage, 0, 0, width, height);
        } catch (e) {
            console.error('Error loading custom feed bg:', e);
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, COLORS.bgFrom);
            gradient.addColorStop(1, COLORS.bgTo);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, COLORS.bgFrom);
        gradient.addColorStop(1, COLORS.bgTo);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Header (Branded)
    if (config.designMode !== 'custom') {
        ctx.fillStyle = COLORS.headerBg;
        ctx.fillRect(0, 0, width, 180);
        ctx.fillStyle = COLORS.accent; // Orange line
        ctx.fillRect(0, 175, width, 5);

        ctx.textAlign = 'center';

        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 50px Arial';
        ctx.fillText('CONCURSO', width / 2, 70);

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 70px Arial';
        ctx.fillText('SANTA 3D', width / 2, 140);
    }

    // 3. Main Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // darker
    ctx.fillRect(50, 230, width - 100, 870); // Adjusted Y
    ctx.strokeStyle = COLORS.accent; // Orange accent
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 230, width - 100, 870);

    // Countdown
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.secondary;
    ctx.font = 'bold 120px Arial';

    // FEED COUNTDOWN LOGIC (Same as Story but Adapted)
    const format = config.timerFormat || 'd-h';
    let feedMainVal = '';
    let feedLabel = '';

    // Calculate total hours
    const feedTotalHours = (stats.timeLeft.days * 24) + stats.timeLeft.hours;

    if (format === 'd') {
        feedMainVal = `${stats.timeLeft.days}`;
        feedLabel = 'DÍAS';
    } else if (format === 'h') {
        feedMainVal = `${feedTotalHours}h`;
        feedLabel = 'HORAS';
    } else if (format === 'h-m') {
        feedMainVal = `${feedTotalHours}h`; // Simplified for big display
        feedLabel = 'HORAS';
    } else {
        // d-h
        if (stats.timeLeft.days == 0) { // LOOSE EQUALITY FIX
            feedMainVal = `${stats.timeLeft.hours}h`;
            feedLabel = 'HORAS';
        } else {
            feedMainVal = `${stats.timeLeft.days}`;
            feedLabel = 'DÍAS';
        }
    }

    ctx.fillText(feedMainVal, width / 2, 380);
    ctx.font = '30px Arial';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(feedLabel + ' PARA CERRAR', width / 2, 440);

    // Participants Count
    ctx.font = 'bold 60px Arial';
    ctx.fillText(stats.participants.toString(), width / 2, 550);
    ctx.font = '25px Arial';
    ctx.fillText('PARTICIPANTES ACTIVOS', width / 2, 590);

    // Ranking Section
    if (stats.topRanked && stats.topRanked.length > 0) {
        drawRankingList(ctx, width / 2, 650, stats.topRanked, width - 100);
    }

    // 4. Footer & Motivation
    // Removed solid rectangle to match mockup (Clean text only)

    // Get message to determine CTA
    const messageData = getDualMessage(stats.timeLeft.days);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 50px Arial';
    const ctaText = messageData.type === 'voting' ? '¡APOYA AL TALENTO!' : '¡PARTICIPA YA!';
    ctx.fillText(ctaText, width / 2, 1220);

    ctx.font = '30px Arial';
    // Show one part of the motivational message here too
    const shortMsg = messageData.type === 'voting' ? 'Vota en @centauroads' : 'Info en @centauroads';
    ctx.fillText(shortMsg, width / 2, 1280);

    return canvas.toBuffer('image/png');
}

// ============================================
// UTILS
// ============================================

async function fetchContestStats(apiUrl) {
    try {
        const response = await axios.get(apiUrl, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching stats:', error.message);
        return {
            participants: 0,
            videos: 0,
            likes: 0,
            timeLeft: { days: 0, hours: 0, minutes: 0, isClosed: false },
            instagramUsers: [],
            recentParticipants: [],
            topRanked: []
        };
    }
}

module.exports = {
    generateStoryImage,
    generateFeedImage,
    fetchContestStats
};
EOF

echo "Updating scripts/instagram-auto-updater.js..."
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

/**
 * Publishes an image to Instagram (Story or Feed)
 * @param {Buffer} imageBuffer - The image data
 * @param {string} caption - Caption text (only for Feed)
 * @param {string} type - 'STORIES' or 'IMAGE' (Feed)
 */
async function publishToInstagram(imageBuffer, caption, type = 'IMAGE') {
  try {
    // 1. Save Image Temporarily (Publicly Accessible)
    const filename = `ig-${type.toLowerCase()}-${Date.now()}.png`;
    const localPath = path.join(CONFIG.publicDir, filename);
    const publicUrl = `${CONFIG.publicUrlBase}/${filename}`;

    fs.writeFileSync(localPath, imageBuffer);
    console.log(`   📂 Saved temp image: ${localPath}`);
    console.log(`   🌐 Public URL: ${publicUrl}`);

    // Data for Container Creation
    const containerParams = {
      image_url: publicUrl,
      access_token: CONFIG.accessToken,
      is_carousel_item: false
    };

    if (type === 'IMAGE') {
      containerParams.caption = caption;
    } else if (type === 'STORIES') {
      containerParams.media_type = 'STORIES';
    }

    // 2. Create Media Container
    console.log(`   ⏳ Creating ${type} container...`);
    const containerUrl = `https://graph.facebook.com/v18.0/${CONFIG.userId}/media`;
    const containerRes = await axios.post(containerUrl, null, { params: containerParams });
    const creationId = containerRes.data.id;

    if (!creationId) throw new Error('No creation ID returned');
    console.log(`   ✅ Container Created ID: ${creationId}`);

    // Wait 5 seconds for Instagram to process the image
    await new Promise(r => setTimeout(r, 5000));

    // 3. Publish Media
    console.log(`   🚀 Publishing...`);
    const publishUrl = `https://graph.facebook.com/v18.0/${CONFIG.userId}/media_publish`;
    const publishRes = await axios.post(publishUrl, null, {
      params: {
        creation_id: creationId,
        access_token: CONFIG.accessToken
      }
    });

    console.log(`   🎉 Published Successfully! Media ID: ${publishRes.data.id}`);

    // Cleanup: Delete temp file after a delay (e.g., 1 min)
    setTimeout(() => {
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }, 60000);

    return publishRes.data.id;

  } catch (error) {
    console.error('   ❌ Publishing Failed:', error.response ? error.response.data : error.message);
    throw error;
  }
}

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
      await publishToInstagram(buffer, '', 'STORIES');
    } else {
      const buffer = await generateFeedImage(stats, CONFIG);
      // Generate Caption
      const captionData = {
        ...stats,
        recentParticipants: stats.recentParticipants || []
      };
      // Mocking caption generator call if needed or reusing lib
      const caption = generateInstagramCaption(captionData);
      await publishToInstagram(buffer, caption, 'IMAGE');
    }

  } catch (error) {
    console.error('   ❌ Job Failed:', error.message);
  }
}

// ============================================
// SCHEDULER
// ============================================

console.log('🤖 Instagram Auto-Updater Started');
console.log(`   POST Schedule (Hours): ${CONFIG.postSchedule}`);
console.log(`   STORY Schedule (Hours): ${CONFIG.storySchedule}`);

// Schedule Feed Posts
const postHours = CONFIG.postSchedule.split(',').map(h => h.trim());
postHours.forEach(hour => {
  cron.schedule(`0 ${hour} * * *`, () => {
    runUpdate('FEED');
  }, { timezone: "America/Caracas" });
  console.log(`   📅 Scheduled Feed Post at ${hour}:00 VET`);
});

// Schedule Stories
const storyHours = CONFIG.storySchedule.split(',').map(h => h.trim());
storyHours.forEach(hour => {
  cron.schedule(`0 ${hour} * * *`, () => {
    runUpdate('STORY');
  }, { timezone: "America/Caracas" });
  console.log(`   📅 Scheduled Story at ${hour}:00 VET`);
});

// Manual Run Detection (npm run manual)
if (process.argv.includes('--manual')) {
  console.log('   🧪 Manual Trigger Detected');
  (async () => {
    await runUpdate('STORY');
    // await runUpdate('FEED'); // Uncomment to test feed too
  })();
}
EOF

echo "Updating app/admin/instagram-config/page_server.tsx..."
cat << 'EOF' > app/admin/instagram-config/page_server.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import html2canvas from 'html2canvas';

type TimerFormat = 'd-h' | 'd' | 'h' | 'h-m';
type PreviewMode = 'stored' | 'feed';

export default function InstagramConfigPage() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [rankings, setRankings] = useState<any[]>([]);

    // Estado base (D, H, M, S reales)
    const [rawTime, setRawTime] = useState<{ totalMs: number }>({ totalMs: 0 });

    // Config States
    const [timerFormat, setTimerFormat] = useState<TimerFormat>('d-h');
    const [activePreview, setActivePreview] = useState<PreviewMode>('stored');
    const [designMode, setDesignMode] = useState<'auto' | 'custom'>('auto');

    // Default Messages
    const [messagesParticipation, setMessagesParticipation] = useState<string>('¡$600 USD AL 1er LUGAR! - ¿Vas a dejar pasar la oportunidad?\n¡GANA $600 USD! - Es tu último chance para participar\n¡PREMIOS EN EFECTIVO! - El primer lugar se lleva $600 USD');
    const [messagesVoting, setMessagesVoting] = useState<string>('¡Tu voto cuenta! - Apoya a tu talento favorito\n¿Ya elegiste tu favorito? - Vota por el mejor Santa 3D\n¡Ayuda a elegir al ganador! - Dale like a los mejores videos');
    const [onlyApproved, setOnlyApproved] = useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false); // New Automation State

    // Refs for capture
    const storyRef = useRef<HTMLDivElement>(null);
    const feedRef = useRef<HTMLDivElement>(null);

    const DEADLINE = new Date('2025-12-30T23:59:59');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        Promise.all([fetchData(token), fetchConfig(token)]);

        const timer = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(timer);
    }, []);

    const updateTimer = () => {
        const now = new Date();
        const diff = DEADLINE.getTime() - now.getTime();
        setRawTime({ totalMs: diff > 0 ? diff : 0 });
    };

    const fetchConfig = async (token: string) => {
        try {
            const res = await axios.get('/api/admin/instagram-config', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.data) {
                const d = res.data.data;
                if (d.timerFormat) setTimerFormat(d.timerFormat);
                if (d.messagesParticipation) {
                    setMessagesParticipation(Array.isArray(d.messagesParticipation) ? d.messagesParticipation.join('\n') : d.messagesParticipation);
                }
                if (d.messagesVoting) {
                    setMessagesVoting(Array.isArray(d.messagesVoting) ? d.messagesVoting.join('\n') : d.messagesVoting);
                }
                if (d.designMode) setDesignMode(d.designMode);
                if (typeof d.onlyApproved !== 'undefined') setOnlyApproved(d.onlyApproved);
            }
        } catch (error) {
            console.warn('Could not fetch existing config, using defaults.', error);
        }
    };

    const fetchData = async (token: string) => {
        setIsLoading(true);
        try {
            const [statsRes, rankRes] = await Promise.all([
                axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/public/ranking', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }
            if (rankRes.data.success) {
                setRankings(rankRes.data.data);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getFormattedTime = () => {
        const ms = rawTime.totalMs;
        const totalMinutes = Math.floor(ms / (1000 * 60));
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        const hoursRemainder = totalHours % 24;
        const minutesRemainder = totalMinutes % 60;

        switch (timerFormat) {
            case 'd':
                return { main: { val: totalDays, label: 'Días' }, secondary: null, text: `${totalDays}d` };
            case 'h':
                return { main: { val: totalHours, label: 'Horas' }, secondary: null, text: `${totalHours}h` };
            case 'h-m':
                return { main: { val: totalHours, label: 'Hrs' }, secondary: { val: minutesRemainder, label: 'Mins' }, text: `${totalHours}h ${minutesRemainder}m` };
            case 'd-h':
            default:
                return { main: { val: totalDays, label: 'Días' }, secondary: { val: hoursRemainder, label: 'Hrs' }, text: `${totalDays}d ${hoursRemainder}h` };
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('admin_token');
        try {
            const payload = {
                timerFormat,
                storyHours: ["8", "20"],
                feedHours: ["12"],
                messagesParticipation: messagesParticipation.split('\n'),
                messagesVoting: messagesVoting.split('\n'),
                onlyApproved,
                designMode
            };

            const res = await axios.post('/api/admin/instagram-config', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert('¡Configuración Guardada Correctamente!');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    // --- NEW: Test Publish Function (Automation) ---
    const handleTestPublish = async () => {
        if (!confirm(`¿Estás seguro de PUBLICAR AHORA MISMO una ${activePreview === 'stored' ? 'Historia' : 'Publicación'} en Instagram REAL?`)) return;

        setIsPublishing(true);
        const token = localStorage.getItem('admin_token');
        try {
            const res = await axios.post('/api/admin/instagram/publish', {
                type: activePreview === 'stored' ? 'STORY' : 'FEED'
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                alert(`¡Éxito! Salida del Bot:\n${res.data.output}`);
            } else {
                alert(`Error: ${res.data.error}`);
            }
        } catch (error: any) {
            console.error('Publish error:', error);
            alert(`Error al publicar: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDownload = async () => {
        const element = activePreview === 'stored' ? storyRef.current : feedRef.current;
        if (!element) return;

        setIsDownloading(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                logging: false
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `instagram-${activePreview}-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Error al generar la imagen. Intenta de nuevo.');
        } finally {
            setIsDownloading(false);
        }
    };

    const timeDisplay = getFormattedTime();

    // USAMOS EL TOTAL DE VIDEOS (10) PARA EL CONTEO
    const ParticipantCount = stats?.videos?.total ?? 0;

    const rankingDisplay = rankings.length > 0 ? rankings : [];

    if (isLoading) return <div className="p-10 text-center">Cargando datos...</div>;

    const getFirstLine = (text: string) => text ? text.split('\n')[0] : '';

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <div className="w-64 bg-[#111111] text-white flex flex-col hidden md:flex flex-shrink-0 z-20">
                <div className="h-16 flex items-center justify-center border-b border-gray-800">
                    <span className="font-bold text-xl text-[#F26522]">CENTAURO ADS</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <a href="/admin/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">Dashboard</a>
                    <a href="#" className="block py-2.5 px-4 rounded bg-gray-800 border-l-4 border-[#F26522] font-bold text-white">Configuración IG</a>
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto relative z-10">
                <header className="bg-white shadow sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">Automatización de Instagram</h1>
                        <div className="flex items-center space-x-4">
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
                                Sistema Activo
                            </span>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-[#4a1d5c] hover:bg-purple-800 text-white font-bold py-2 px-4 rounded shadow disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

                    {/* SECCION 1: Formato Cuenta Regresiva */}
                    <div className="bg-white shadow rounded-lg mb-8 border-l-4 border-[#4a1d5c]">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F26522]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                1. Formato de Cuenta Regresiva
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['d-h', 'd', 'h', 'h-m'].map((fmt) => (
                                    <label key={fmt} className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="timer_format"
                                            className="peer sr-only"
                                            checked={timerFormat === fmt}
                                            onChange={() => setTimerFormat(fmt as TimerFormat)}
                                        />
                                        <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 peer-checked:border-[#F26522] peer-checked:bg-orange-50 transition-all text-center">
                                            <div className="text-lg font-bold text-gray-800">
                                                {fmt === 'd-h' && 'Días y Horas'}
                                                {fmt === 'd' && 'Solo Días'}
                                                {fmt === 'h' && 'Solo Horas'}
                                                {fmt === 'h-m' && 'Horas y Min'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {fmt === 'd-h' && 'Ej: 5d 12h'}
                                                {fmt === 'd' && 'Ej: 5 Días'}
                                                {fmt === 'h' && 'Ej: 48 Horas'}
                                                {fmt === 'h-m' && 'Ej: 12h 45m'}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECCION 2: Horarios */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F26522]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                2. Horarios de Publicación
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Historias (Stories)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        08:00 AM <button className="ml-2 text-purple-600">×</button>
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        08:00 PM <button className="ml-2 text-purple-600">×</button>
                                    </span>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Publicaciones (Feed)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                        12:00 PM <button className="ml-2 text-blue-600">×</button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCION 3: Personalizacion */}
                    <div className="bg-white shadow rounded-lg mb-8 z-20 relative">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F26522]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                3. Personalización de Mensajes
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mensajes de "Participación" ($600 USD)</label>
                                <p className="text-xs text-gray-500 mb-2">Edita aquí el texto que aparecerá en la franja naranja de las Historias.</p>
                                <textarea
                                    rows={4}
                                    disabled={false}
                                    style={{ position: 'relative', zIndex: 50, opacity: 1 }}
                                    className="text-gray-900 shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                    value={messagesParticipation}
                                    onChange={(e) => setMessagesParticipation(e.target.value)}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mensajes de "Votación" (Comunidad)</label>
                                <p className="text-xs text-gray-500 mb-2">Edita aquí el texto cursivo del encabezado del Feed.</p>
                                <textarea
                                    rows={4}
                                    disabled={false}
                                    style={{ position: 'relative', zIndex: 50, opacity: 1 }}
                                    className="text-gray-900 shadow-sm focus:ring-[#F26522] focus:border-[#F26522] block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                    value={messagesVoting}
                                    onChange={(e) => setMessagesVoting(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCION 4: Diseño y Publicación (Con Botones de Test) */}
                    <div className="bg-white shadow rounded-lg mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#F26522]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                4. Diseño y Publicación (Graph API)
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-3">Vista Previa:</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setActivePreview('stored')}
                                        className={`flex-1 font-semibold py-3 px-4 rounded border shadow-sm flex items-center justify-center gap-2 transition-all ${activePreview === 'stored' ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
                                    >
                                        <span className="text-xl">📱</span> Historia
                                    </button>
                                    <button
                                        onClick={() => setActivePreview('feed')}
                                        className={`flex-1 font-semibold py-3 px-4 rounded border shadow-sm flex items-center justify-center gap-2 transition-all ${activePreview === 'feed' ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'}`}
                                    >
                                        <span className="text-xl">🖼️</span> Feed
                                    </button>
                                </div>

                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="w-full mt-4 bg-[#F26522] hover:bg-orange-600 text-white font-bold py-3 px-4 rounded shadow flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mb-3"
                                >
                                    {isDownloading ? 'Generando...' : `Descargar Diseño ${activePreview === 'stored' ? '(Historia)' : '(Feed)'}`}
                                </button>

                                {/* BOTON DE PUBLICACION AUTOMATICA (NUEVO) */}
                                <button
                                    onClick={handleTestPublish}
                                    disabled={isPublishing}
                                    className={`w-full font-bold py-3 rounded text-white shadow transition-colors flex items-center justify-center gap-2 ${isPublishing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 animate-pulse'}`}
                                >
                                    {isPublishing ? 'Publicando en Instagram...' : `🚀 PUBLICAR REAL (TEST)`}
                                </button>
                                <p className="text-xs text-gray-500 mt-1 text-center">⚠️ Esto subirá la imagen inmediatamente a la cuenta conectada.</p>
                            </div>

                            <div className="border rounded-lg p-6 bg-gray-50 flex flex-col items-center justify-center min-h-[400px]">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
                                    Vista Previa ({activePreview === 'stored' ? 'Historia' : 'Feed'})
                                </span>

                                {activePreview === 'stored' ? (
                                    /* STORY PREVIEW */
                                    <div ref={storyRef} className="w-[270px] h-[480px] bg-[#4a1d5c] rounded-xl border-none shadow-2xl relative overflow-hidden flex flex-col items-center select-none">
                                        {/* Header (Unified) */}
                                        <div className="w-full h-14 bg-purple-900 border-b border-orange-500 flex flex-col justify-center items-center pt-1 flex-shrink-0">
                                            <span className="text-[9px] text-[#F26522] font-bold tracking-[0.2em] leading-tight">CONCURSO SANTA 3D</span>
                                            <span className="text-[11px] text-white font-black tracking-[0.2em] leading-tight">VENEZOLANO</span>
                                            <div className="w-16 h-px bg-orange-500 mt-1"></div>
                                        </div>

                                        {/* Countdown Section */}
                                        <div className="mt-6 text-center z-10 flex-shrink-0">
                                            <div className="text-yellow-400 text-xs font-bold uppercase mb-1">Quedan Solo</div>
                                            <div className="flex justify-center items-end gap-1 text-white leading-none">
                                                <span className="text-6xl font-black block drop-shadow-md">{timeDisplay.main.val}</span>
                                                {timeDisplay.secondary && <span className="text-2xl font-bold mb-2 opacity-80">{timeDisplay.secondary.val}h</span>}
                                            </div>
                                            <span className="text-sm text-gray-300 font-bold uppercase tracking-[0.2em] block mt-1">{timeDisplay.main.label}</span>
                                        </div>

                                        {/* 1) Message MOVED to Center & Striking */}
                                        <div className="my-auto w-full px-4 z-20 flex-shrink-0 flex items-center justify-center">
                                            <div className="bg-[#F26522] text-white font-black text-center py-4 px-2 rounded transform -rotate-1 shadow-lg border-2 border-white/20 w-full shadow-orange-500/50">
                                                <span className="block text-lg uppercase leading-tight drop-shadow-sm italic">
                                                    {getFirstLine(messagesParticipation) || '¡PARTICIPA YA!'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 3) Ranking List (Replacing numeric stats) */}
                                        <div className="mt-auto w-full px-4 z-10 flex-grow-0 pb-4">
                                            <div className="text-left w-full bg-black/80 p-3 rounded-lg border border-white/10">
                                                <div className="text-[9px] font-bold text-gray-300 uppercase mb-2 border-b border-white/10 pb-1 flex justify-between">
                                                    <span>🔥 Liderando</span>
                                                    <span className="text-yellow-500">Likes</span>
                                                </div>

                                                {rankingDisplay.length > 0 ? (
                                                    rankingDisplay.slice(0, 3).map((r, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs mb-1.5 last:mb-0">
                                                            <span className="font-bold text-white truncate max-w-[140px] flex items-center gap-1">
                                                                <span className="text-sm">{i === 0 && '🥇'} {i === 1 && '🥈'} {i === 2 && '🥉'}</span>
                                                                {r.instagram || r.alias || 'Anon'}
                                                            </span>
                                                            <span className="font-mono font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                                                                {(r.score ?? r.likes ?? 0).toFixed(0)}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-[10px] text-gray-400 py-2">Sin datos aun</div>
                                                )}
                                            </div>

                                            <div className="mt-2 flex justify-center items-center gap-2">
                                                <span className="text-[10px] text-gray-400 font-medium">Participantes:</span>
                                                <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">{ParticipantCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* FEED PREVIEW */
                                    <div ref={feedRef} className="w-[320px] h-[400px] bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-white rounded-lg shadow-2xl relative overflow-hidden flex flex-col items-center select-none">

                                        {/* 1) Feed Header: Unified with Story */}
                                        <div className="w-full h-14 bg-purple-900 border-b border-orange-500 flex flex-col justify-center items-center pt-1 flex-shrink-0 absolute top-0 left-0 z-20">
                                            <span className="text-[9px] text-[#F26522] font-bold tracking-[0.2em] leading-tight">CONCURSO SANTA 3D</span>
                                            <span className="text-[11px] text-white font-black tracking-[0.2em] leading-tight">VENEZOLANO</span>
                                            <div className="w-16 h-px bg-orange-500 mt-1"></div>
                                        </div>

                                        <div className="pt-16 w-full px-6 flex flex-col h-full relative z-10 pb-12">

                                            {/* Message Striking */}
                                            <div className="mb-4 text-center mt-2 flex-shrink-0">
                                                <div className="transform -rotate-1">
                                                    <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 leading-tight drop-shadow-sm italic filter drop-shadow-lg">
                                                        "{getFirstLine(messagesVoting) || '¡VOTA POR TU FAVORITO!'}"
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Ranking List */}
                                            <div className="text-left w-full bg-black/80 p-4 rounded-lg border border-white/10 mb-4 flex-grow-0">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 border-b border-white/10 pb-1 flex justify-between items-center">
                                                    <span>Top 3</span>
                                                    <span className="text-[9px] text-gray-500">Likes en Instagram</span>
                                                </div>

                                                {rankingDisplay.length > 0 ? (
                                                    rankingDisplay.slice(0, 3).map((r, i) => (
                                                        <div key={i} className="flex justify-between items-center text-sm mb-2 last:mb-0">
                                                            <span className="font-bold text-white truncate max-w-[160px] flex items-center gap-2">
                                                                <span className="text-sm">{i === 0 && '🥇'} {i === 1 && '🥈'} {i === 2 && '🥉'}</span>
                                                                {r.instagram || r.alias || 'Anon'}
                                                            </span>
                                                            <span className="font-mono font-bold text-yellow-400">
                                                                {(r.score ?? r.likes ?? 0).toFixed(0)}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-xs text-gray-500 py-2">Esperando datos...</div>
                                                )}
                                            </div>

                                            {/* Vertical Stats (New Design) */}
                                            <div className="flex flex-col items-center justify-center mt-auto mb-4 gap-1">
                                                <div className="text-center">
                                                    <span className="text-gray-300 font-bold italic text-sm">Solo falta </span>
                                                    <span className="text-[#ff0055] font-black italic text-sm">{timeDisplay.text}</span>
                                                    <span className="text-gray-300 font-bold italic text-sm"> para cerrar!</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-white font-bold text-xs uppercase tracking-wider">Participantes {ParticipantCount}</span>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Footer Removed (clean bottom) */}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
EOF

echo "Files updated."
echo "Running Prisma DB Push..."
npx prisma db push

echo "Restarting application (optional, dependent on setup)..."
# pm2 restart all
echo "Deployment Complete!"
