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
