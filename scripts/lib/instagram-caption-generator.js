// lib/instagram-caption-generator.js
// Generador de Caption para Instagram - Con stats en tiempo real

// ============================================
// EMOJIS Y SÍMBOLOS
// ============================================

const EMOJIS = {
    fire: '🔥',
    trophy: '🏆',
    santa: '🎅',
    star: '⭐',
    alert: '🚨',
    clock: '⏰',
    heart: '❤️',
    users: '👥',
    video: '🎬',
    location: '📌',
    link: '🔗',
    arrow: '👉',
    check: '✅',
    sparkle: '✨',
    lightning: '⚡',
    megaphone: '📢'
};

// ============================================
// UTILS
// ============================================

function getUrgencyLevel(daysLeft) {
    if (daysLeft === 0) return 'critical';
    if (daysLeft === 1) return 'high';
    if (daysLeft <= 3) return 'high';
    if (daysLeft <= 7) return 'medium';
    return 'low';
}

function formatTimeLeft(timeLeft) {
    const { days, hours, minutes, isClosed } = timeLeft;

    if (isClosed) {
        return 'Concurso cerrado';
    }

    if (days === 0) {
        if (hours === 0) {
            return `${minutes} minutos ${EMOJIS.fire}`;
        }
        return `${hours} horas, ${minutes % 60} minutos ${EMOJIS.fire}`;
    }

    return `${days} ${days === 1 ? 'día' : 'días'} (${hours}h)`;
}

// Rotation logic for captions (matching Image Generator)
function getDualHeadline(timeLeft, urgency) {
    const { days, hours, isClosed } = timeLeft;
    const currentHour = new Date().getHours();
    const isVotingTime = currentHour % 2 === 0;

    if (isClosed) {
        return `${EMOJIS.alert} CONCURSO CERRADO ${EMOJIS.alert}\n\n¡Gracias a todos los participantes! Pronto anunciaremos los ganadores.`;
    }

    // Critical urgency overrides voting messages
    if (urgency === 'critical') {
        return `${EMOJIS.fire}${EMOJIS.alert} ¡ÚLTIMA OPORTUNIDAD! ${EMOJIS.alert}${EMOJIS.fire}\n\nCONCURSO SANTA 3D VENEZOLANO\n${EMOJIS.clock} QUEDAN SOLO ${hours} HORAS\n\n${EMOJIS.megaphone} ¡CIERRA HOY! Animate, se parte de los valientes`;
    }

    if (isVotingTime) {
        return `${EMOJIS.heart} ¡TU VOTO DECIDE EL GANADOR! ${EMOJIS.heart}\n\nCONCURSO SANTA 3D VENEZOLANO\n${EMOJIS.star} Apoya al talento nacional\n\n${EMOJIS.arrow} Busca a tu favorito y dale like`;
    } else {
        // Participation Focus
        if (urgency === 'high') {
            return `${EMOJIS.fire} ¡ESTAMOS YA POR CERRAR! ${EMOJIS.fire}\n\nCONCURSO SANTA 3D VENEZOLANO\n${EMOJIS.clock} QUEDAN ${days} ${days === 1 ? 'DÍA' : 'DÍAS'}\n\n${EMOJIS.trophy} Animate, se parte de los valientes`;
        }
        return `${EMOJIS.santa} CONCURSO SANTA 3D VENEZOLANO ${EMOJIS.santa}\n\n${EMOJIS.star} ¡Aún estás a tiempo de participar!\n\n${EMOJIS.trophy} Sé parte de los diseñadores élite de Venezuela`;
    }
}

// ============================================
// FUNCIÓN PRINCIPAL: Generar Caption
// ============================================

function generateInstagramCaption(data) {
    const { participants, videos, likes, timeLeft, instagramUsers, recentParticipants } = data;

    // Determinar urgencia del mensaje
    const urgencyLevel = getUrgencyLevel(timeLeft.days);
    const headerMsg = getDualHeadline(timeLeft, urgencyLevel);

    // Construir caption
    let caption = `${headerMsg}\n\n`;

    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `${EMOJIS.megaphone} ESTADÍSTICAS EN TIEMPO REAL\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // STATS PRINCIPALES
    caption += `${EMOJIS.users} CONCURSANTES: ${participants}\n`;
    caption += `${EMOJIS.video} VIDEOS APROBADOS: ${videos}\n`;
    caption += `${EMOJIS.heart} LIKES TOTALES: ${likes}\n`;
    caption += `${EMOJIS.clock} TIEMPO RESTANTE: ${formatTimeLeft(timeLeft)}\n\n`;

    // ÚLTIMOS PARTICIPANTES (Top 3)
    if (recentParticipants && recentParticipants.length > 0) {
        caption += `${EMOJIS.sparkle} ÚLTIMOS VALIENTES:\n`;
        recentParticipants.slice(0, 3).forEach((p, i) => {
            const igHandle = p.instagram ? `(${p.instagram})` : '';
            caption += `${i + 1}. ${p.name} ${igHandle}\n`;
        });
        caption += `\n`;
    }

    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `${EMOJIS.trophy} ¿QUIERES PARTICIPAR?\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    caption += `${EMOJIS.fire} $600 USD EN EFECTIVO\n`;
    caption += `${EMOJIS.star} Proyección en pantalla LED gigante\n`;
    caption += `${EMOJIS.location} Chacao, Caracas\n\n`;

    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `${EMOJIS.check} PASOS SIMPLES\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    caption += `1${EMOJIS.arrow} Crea tu Santa 3D\n`;
    caption += `2${EMOJIS.arrow} Regístrate (link en bio)\n`;
    caption += `3${EMOJIS.arrow} Sube tu video\n\n`;

    // CTA URGENTE (basado en urgencia y tipo de mensaje)
    const currentHour = new Date().getHours();
    const isVotingTime = currentHour % 2 === 0;

    if (urgencyLevel === 'critical') {
        caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `${EMOJIS.alert} ${EMOJIS.fire} ¡ÚLTIMA OPORTUNIDAD! ${EMOJIS.fire} ${EMOJIS.alert}\n`;
        caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    } else if (isVotingTime) {
        caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `${EMOJIS.heart} ¡APOYA A TU FAVORITO! ${EMOJIS.heart}\n`;
        caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        caption += `Ve a la sección de ETIQUETADOS y dale like a los videos que más te gusten.\n\n`;
    } else {
        caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        caption += `${EMOJIS.fire} ¡NO TE QUEDES FUERA! ${EMOJIS.fire}\n`;
        caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    caption += `${EMOJIS.link} LINK EN BIO\n`;
    caption += `${EMOJIS.arrow} @centauroads\n\n`;

    // HASHTAGS
    caption += `#Santa3D #Venezuela #Concurso #Centauro #Arte3D #Animacion3D #Caracas #Chacao #MotionGraphics #Blender #Cinema4D #UnrealEngine #DiseñoVenezolano #TalentoVenezolano #CreatividadVenezolana #Premios #Navidad2024\n\n`;

    // DÓNDE ENCONTRAR A LOS PARTICIPANTES
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `${EMOJIS.location} ENCUÉNTRALOS EN ETIQUETADOS\n`;
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    caption += `Revisa los participantes en la sección de ETIQUETADOS de @centauroads\n\n`;

    // FOOTER
    caption += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    caption += `${EMOJIS.lightning} Última actualización: ${new Date().toLocaleString('es-VE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    })}\n\n`;

    caption += `${EMOJIS.clock} Este post se actualiza cada 6 horas\n`;
    caption += `${EMOJIS.fire} ¡Sé parte de los mejores diseñadores 3D de Venezuela!\n`;

    return caption;
}

module.exports = {
    generateInstagramCaption,
    getUrgencyLevel,
    formatTimeLeft
};
