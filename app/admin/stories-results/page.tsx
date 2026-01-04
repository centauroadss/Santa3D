'use client';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Download, ChevronLeft, ChevronRight, Copy, Share, Instagram, Trophy, Award, Medal, CheckCircle2 } from 'lucide-react';

const MESSAGES = [
    {
        id: 1,
        title: "INTRO GRACIAS",
        type: "intro",
        content: {
            title: "GRACIAS, ARTISTAS VENEZOLANOS 💜",
            highlight: "15 VALIENTES",
            body: [
                "que se atrevieron a crear, innovar y compartir su talento.",
                "Cada Santa 3D cuenta una historia única. Cada diseño refleja PASIÓN y DEDICACIÓN.",
                "Ustedes son el FUTURO del arte digital y juntos vamos a ir construyendo esta comunidad vibrante de Venezuela. 🇻🇪✨"
            ],
            footer: "TODOS son ganadores por PARTICIPAR.",
            hashtags: "#OrgulloVenezolano #Santa3D #SantaVenezolano"
        }
    },
    {
        id: 2,
        title: "PROCESO DE EVALUACIÓN",
        type: "process",
        content: {
            header: "PROCESO DE EVALUACIÓN",
            body: "Nuestro JURADO EXPERTO en arte 3D evaluó cada diseño con CRITERIOS OBJETIVOS y PROFESIONALES.",
            subtext: "Proceso 100% TRANSPARENTE basado en estándares internacionales de animación y modelado 3D.",
            callToAction: "🎯 A continuación, los criterios que determinaron la clasificación..."
        }
    },
    {
        id: 3,
        title: "CRITERIOS OFICIALES",
        type: "criteria",
        content: {
            header: "CRITERIOS OFICIALES DE EVALUACIÓN",
            scale: "Escala: 0-20 pts | Máx: 100 pts",
            items: [
                { text: "Creatividad y Originalidad", pct: "20%" },
                { text: "Calidad Técnica 3D", pct: "30%" },
                { text: "Impacto Visual", pct: "20%" },
                { text: "Identidad Venezolana", pct: "20%" },
                { text: "Narrativa/Storytelling", pct: "10%" }
            ],
            footer: "¡Ahora descubre las POSICIONES! 🏆"
        }
    },
    {
        id: 4,
        title: "POSICIONES #15-#11",
        type: "ranking_low",
        content: {
            range: "Posiciones #15 al #11",
            body: "Su valentía para participar ya es un TRIUNFO. El arte 3D es un viaje, y cada proyecto es un escalón hacia la maestría. Esperamos verlos en el próximo concurso más preparados y confiados.",
            footer: "¡SIGAN CREANDO! 💪🎨"
        }
    },
    {
        id: 5,
        title: "TOP 10 (#10-#6)",
        type: "ranking_mid",
        content: {
            range: "TOP 10 (#6-#10)",
            header: "Ser parte del TOP 10 es un logro!!! 🎉🎊✨",
            body: "Su talento destacó y el jurado notó sus fortalezas. Con un poco más de práctica y técnica, serán IMPARABLES.",
            footer: "¡Cuenten con nosotros para el próximo reto! 🚀"
        }
    },
    {
        id: 6,
        title: "SEMIFINALISTAS (#4-#6)",
        type: "ranking_high",
        content: {
            range: "SEMIFINALISTAS (#4-#6)",
            header: "¡SEMIFINALISTAS!",
            body: "Su trabajo está a nivel PROFESIONAL. Estuvieron MUY CERCA del podio. El jurado quedó impresionado con su técnica y creatividad.",
            footer: "¡Son un talento y ejemplo a seguir! 👏✨"
        }
    },
    {
        id: 7,
        title: "INTRO CAMPEONES",
        type: "champion_intro",
        content: {
            main: "¡CAMPEONES!",
            body: "Sus posiciones son MUY MERECIDAS. Su trabajo representa lo MEJOR del arte 3D venezolano.",
            footer: "Estamos ORGULLOSOS de sus logros. ¡Los esperamos como jurado invitado o concursantes en el próximo concurso! 🏆🎉"
        }
    },
    {
        id: 8,
        title: "BRONCE - 3ER LUGAR",
        type: "winner",
        medal: "bronze",
        data: {
            position: "POSICIÓN #3",
            medalTitle: "MEDALLA DE BRONCE",
            name: "JONATHAN MOLEIRO",
            handle: "@Moleir0",
            alias: "moleiro",
            highlightBox: "ORIGINALIDAD CONCEPTUAL",
            msg: "Jonathan, tu CONCEPTO es FRESCO y ÚNICO. Lograste algo difícil: sorprender al jurado con una propuesta INNOVADORA. ¡Tu creatividad no tiene límites! 🚀💡"
        }
    },
    {
        id: 9,
        title: "PLATA - 2DO LUGAR",
        type: "winner",
        medal: "silver",
        data: {
            position: "SEGUNDO LUGAR",
            medalTitle: "MEDALLA DE PLATA",
            name: "SEBASTIÁN DÍAZ",
            handle: "@sebastiandiaz012",
            alias: "",
            highlightBox: "TÉCNICA 3D EXCEPCIONAL",
            msg: "Sebastián, tu DOMINIO TÉCNICO es IMPRESIONANTE. Modelado, texturas, render... TODO a nivel PROFESIONAL. ¡Mereces estar en el PODIO! 👏🔥",
            bullets: [
                "Texturas fotorrealistas",
                "Geometría impecable",
                "Iluminación cinematográfica",
                "Rendering de alta calidad"
            ],
            footer: "¡FELICIDADES, PLATA! 🥉" // User requested Bronze emoji here? No, user said "FELICIDADES, PLATA! 🥉". I'll keep it as requested but maybe user typo.
        }
    },
    {
        id: 10,
        title: "ORO - 1ER LUGAR",
        type: "winner",
        medal: "gold",
        data: {
            position: "PRIMER LUGAR",
            medalTitle: "MEDALLA DE ORO",
            name: "YEFREN DELGADO",
            handle: "@yefrendelgado",
            alias: "",
            highlightBox: "BALANCE PERFECTO",
            msg: "Yefren, lograste el EQUILIBRIO ideal entre TÉCNICA, CREATIVIDAD e IMPACTO. Tu Santa es una obra MAESTRA. ¡Estuviste simplemente increíble! 🎨👑",
            bullets: [
                "Creatividad excepcional",
                "Identidad venezolana muy presente",
                "Narrativa clara y emotiva",
                "Ejecución técnica sobresaliente"
            ],
            footer: "¡Aplausos para nuestro CAMPEÓN! 👏👏👏"
        }
    },
    {
        id: 11,
        title: "OUTRO VENEZUELA",
        type: "outro",
        content: {
            title: "GRACIAS, VENEZUELA ✨🎄",
            stats: ["15 ARTISTAS", "15 HISTORIAS", "15 SANTAS ÚNICOS"],
            body: "Juntos demostraron que el TALENTO venezolano no tiene límites. Este concurso es solo el COMIENZO de algo GRANDE.",
            future: [
                "Nuevo concurso en 2026",
                "Premios más grandes",
                "Más oportunidades"
            ],
            callToAction: "¿Quieres ser parte de la próxima convocatoria?",
            actions: [
                "👉 ACTIVA LAS NOTIFICACIONES 🔔",
                "👉 SÍGUENOS en @centauroads",
                "👉 ETIQUETA a un artista que deba participar"
            ],
            hashtags: "#ConcursoSanta3D #Venezuela #Arte3D #ComunidadCreativa #CentauroADS #OrgulloVenezolano #TalentoNacional",
            final: "¡NOS VEMOS EN 2026! 🚀🎨"
        }
    }
];

export default function StoriesGeneratorPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [generating, setGenerating] = useState(false);

    // Editable state for winners (simplified for MVP: modify array directly or simple inputs if needed, 
    // but requirement is 'Create Templates', so constant data matching user request is fine initially.
    // I will making editable would be better but static is safer to match request EXACTLY)

    const downloadImage = async () => {
        const element = document.getElementById('story-canvas');
        if (!element) return;

        setGenerating(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2, // High res
                useCORS: true,
                backgroundColor: '#2a0a45', // Ensure background set
            });

            const link = document.createElement('a');
            link.download = `story_result_${MESSAGES[currentSlide].id}_${MESSAGES[currentSlide].title.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error(e);
            alert('Error generando imagen');
        } finally {
            setGenerating(false);
        }
    };

    const nextSlide = () => setCurrentSlide(prev => (prev + 1) % MESSAGES.length);
    const prevSlide = () => setCurrentSlide(prev => (prev - 1 + MESSAGES.length) % MESSAGES.length);

    const msg = MESSAGES[currentSlide];

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center gap-8">
            <div className="w-full max-w-6xl flex justify-between items-center">
                <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Generador de Historias</h1>
                <div className="flex gap-4">
                    <button onClick={downloadImage} disabled={generating} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {generating ? 'Generando...' : 'Descargar PNG'}
                        <Download size={20} />
                    </button>
                    <button onClick={prevSlide} className="p-3 bg-white rounded-full shadow hover:bg-gray-50"><ChevronLeft /></button>
                    <span className="font-mono font-bold bg-white px-4 py-3 rounded-lg shadow-sm">{currentSlide + 1} / {MESSAGES.length}</span>
                    <button onClick={nextSlide} className="p-3 bg-white rounded-full shadow hover:bg-gray-50"><ChevronRight /></button>
                </div>
            </div>

            {/* PREVIEW CONTAINER (Phone Aspect Ratio 9:16) */}
            <div className="relative shadow-2xl rounded-3xl overflow-hidden border-8 border-gray-800 bg-gray-900" style={{ width: '400px', height: '711px' }}> {/* 1080x1920 scaled down by ~2.7 */}
                {/* SCALED CONTENT WRAPPER */}
                {/* We render at full scale internally via transform to ensure quality? 
                     Or html2canvas works on visual size? 
                     Better to render at 1080x1920 logical pixels but scaled down with CSS transform for preview.
                 */}
                <div
                    id="story-canvas"
                    className="origin-top-left bg-[#2a0a45] text-white overflow-hidden relative"
                    style={{
                        width: '1080px',
                        height: '1920px',
                        transform: 'scale(0.37037)', // 400 / 1080
                    }}
                >
                    {/* GLOBAL DECORATION */}
                    <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#F26B21]/20 to-transparent blur-3xl" />
                    <div className="absolute bottom-0 inset-x-0 h-96 bg-gradient-to-t from-[#4a1d75] to-transparent" />

                    {/* Top Branding */}
                    <div className="absolute top-20 left-0 w-full text-center z-10">
                        <div className="inline-block px-12 py-3 bg-[#F26B21] text-white font-black text-2xl uppercase tracking-widest rounded-full shadow-lg">
                            Concurso Santa 3D
                        </div>
                    </div>

                    {/* CONTENT RENDERER */}
                    <div className="w-full h-full flex flex-col justify-center items-center p-20 relative z-20">

                        {/* 1. INTRO */}
                        {msg.type === 'intro' && (
                            <div className="text-center space-y-16">
                                <h1 className="text-8xl font-black text-[#F26B21] leading-tight drop-shadow-lg">
                                    {msg.content.title.replace('GRACIAS,', 'GRACIAS,\n')}
                                </h1>
                                <div className="text-5xl font-bold leading-normal text-gray-100">
                                    A los <span className="text-[#FDB913] text-7xl font-black block mt-4 mb-4">{msg.content.highlight}</span>
                                    {msg.content.body[0]}
                                </div>
                                <div className="space-y-8 bg-[#4a1d75]/50 p-10 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-4xl font-medium leading-relaxed">{msg.content.body[1]}</p>
                                    <p className="text-4xl font-medium leading-relaxed text-[#FDB913]">{msg.content.body[2]}</p>
                                </div>
                                <div className="pt-10">
                                    <p className="text-5xl font-black uppercase text-white mb-8 tracking-wide">{msg.content.footer}</p>
                                    <p className="text-3xl font-bold text-[#F26B21]/80">{msg.content.hashtags}</p>
                                </div>
                            </div>
                        )}

                        {/* 2. PROCESS */}
                        {msg.type === 'process' && (
                            <div className="text-center space-y-20">
                                <div className="flex justify-center gap-8 mb-10">
                                    <UserCheckIcon size={180} className="text-[#FDB913]" />
                                    <SearchIcon size={180} className="text-[#F26B21]" />
                                </div>
                                <h2 className="text-7xl font-black uppercase tracking-tight bg-white/10 inline-block px-12 py-6 rounded-2xl">{msg.content.header}</h2>
                                <p className="text-5xl leading-normal font-medium max-w-4xl mx-auto">
                                    {msg.content.body}
                                </p>
                                <div className="h-1 w-64 bg-gradient-to-r from-transparent via-[#FDB913] to-transparent mx-auto" />
                                <p className="text-4xl italic text-gray-300 max-w-3xl mx-auto">
                                    {msg.content.subtext}
                                </p>
                                <div className="bg-[#F26B21] text-white p-10 rounded-3xl mt-12 shadow-2xl shadow-[#F26B21]/30 animate-pulse">
                                    <p className="text-4xl font-black uppercase">{msg.content.callToAction}</p>
                                </div>
                            </div>
                        )}

                        {/* 3. CRITERIA */}
                        {msg.type === 'criteria' && (
                            <div className="text-center w-full">
                                <div className="mb-16">
                                    <h2 className="text-6xl font-black uppercase mb-4 text-[#FDB913]">{msg.content.header}</h2>
                                    <p className="text-3xl font-mono text-gray-400 bg-black/30 inline-block px-6 py-2 rounded-lg">{msg.content.scale}</p>
                                </div>
                                <div className="space-y-8 w-full max-w-3xl mx-auto">
                                    {msg.content.items.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-[#4a1d75] p-8 rounded-2xl border border-white/5 shadow-lg transform hover:scale-105 transition-transform">
                                            <div className="flex items-center gap-6">
                                                <CheckCircle2 size={64} className="text-[#00ff9d]" />
                                                <span className="text-4xl font-bold text-left">{item.text}</span>
                                            </div>
                                            <span className="text-5xl font-black text-[#FDB913]">{item.pct}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-20 text-5xl font-black uppercase text-white animate-bounce">{msg.content.footer}</p>
                            </div>
                        )}

                        {/* 4, 5, 6, 7. RANKING GROUPS */}
                        {(msg.type.startsWith('ranking_') || msg.type === 'champion_intro') && (
                            <div className="text-center space-y-16 max-w-4xl relative">
                                {/* Background Badge */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-r from-[#F26B21]/10 to-[#FDB913]/10 rounded-full blur-[100px] -z-10" />

                                <div className="inline-block px-12 py-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-10">
                                    <h3 className="text-4xl font-black uppercase tracking-widest text-[#FDB913]">
                                        {msg.title}
                                    </h3>
                                </div>

                                {msg.content.header && (
                                    <h2 className="text-6xl font-black uppercase leading-tight text-white mb-8">
                                        {msg.content.header}
                                    </h2>
                                )}

                                {msg.content.main && (
                                    <h1 className="text-9xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#FDB913] to-[#F26B21] drop-shadow-2xl mb-12">
                                        {msg.content.main}
                                    </h1>
                                )}

                                <div className="bg-[#2a0a45] p-12 rounded-[40px] border-2 border-[#4a1d75] shadow-2xl relative">
                                    <div className="absolute -top-6 -left-6 text-8xl">❝</div>
                                    <div className="absolute -bottom-6 -right-6 text-8xl rotate-180">❝</div>
                                    <p className="text-5xl leading-relaxed font-medium text-gray-100">
                                        {msg.content.body}
                                    </p>
                                </div>

                                {msg.content.footer && (
                                    <p className="text-4xl font-black text-[#F26B21] uppercase tracking-wide pt-8">
                                        {msg.content.footer}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 8, 9, 10. WINNERS */}
                        {msg.type === 'winner' && (
                            <div className="text-center w-full max-w-5xl relative">
                                {/* Medal visual */}
                                <div className="mb-12 flex flex-col items-center justify-center animate-bounce-slow">
                                    {msg.medal === 'bronze' && <div className="w-64 h-64 rounded-full bg-gradient-to-br from-[#CD7F32] to-[#8B4513] shadow-[0_0_100px_rgba(205,127,50,0.6)] flex items-center justify-center text-9xl">🥉</div>}
                                    {msg.medal === 'silver' && <div className="w-64 h-64 rounded-full bg-gradient-to-br from-[#E0E0E0] to-[#757575] shadow-[0_0_100px_rgba(224,224,224,0.6)] flex items-center justify-center text-9xl">🥈</div>}
                                    {msg.medal === 'gold' && <div className="w-64 h-64 rounded-full bg-gradient-to-br from-[#FFD700] to-[#B8860B] shadow-[0_0_100px_rgba(255,215,0,0.6)] flex items-center justify-center text-9xl">🏆</div>}

                                    <div className="mt-8 px-8 py-3 bg-black/40 rounded-full border border-white/20">
                                        <h3 className={`text-4xl font-black uppercase tracking-widest ${msg.medal === 'bronze' ? 'text-[#CD7F32]' :
                                                msg.medal === 'silver' ? 'text-gray-300' : 'text-[#FFD700]'
                                            }`}>
                                            {msg.data.medalTitle}
                                        </h3>
                                    </div>
                                </div>

                                {/* Name & Title */}
                                <div className="mb-16">
                                    <h1 className="text-7xl font-black uppercase mb-4 leading-tight">{msg.data.name}</h1>
                                    <p className="text-5xl font-bold text-[#FDB913] mb-2">{msg.data.handle}</p>
                                    {msg.data.alias && <p className="text-3xl font-mono text-gray-400 uppercase">{msg.data.alias}</p>}
                                </div>

                                {/* Highlight Box */}
                                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 border-l-8 border-[#F26B21] mb-12 text-left shadow-xl">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-[#F26B21] rounded-lg text-white"><Medal size={40} /></div>
                                        <div>
                                            <span className="text-2xl uppercase font-bold text-gray-400 block pt-4">Destacó en:</span>
                                            <span className="text-4xl font-black uppercase text-white">{msg.data.highlightBox}</span>
                                        </div>
                                    </div>
                                    <p className="text-4xl leading-relaxed italic text-gray-100 mt-6 border-t border-white/10 pt-6">
                                        "{msg.data.msg}"
                                    </p>
                                </div>

                                {/* Bullets (Silver/Gold) */}
                                {msg.data.bullets && (
                                    <div className="bg-black/30 rounded-3xl p-10 mb-10 text-left">
                                        <h4 className="text-3xl font-bold uppercase text-[#FDB913] mb-6 flex items-center gap-3">
                                            <Award /> El jurado destacó:
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {msg.data.bullets.map((b: string, i: number) => (
                                                <div key={i} className="flex items-center gap-4 text-3xl font-medium">
                                                    <span className="text-[#FDB913]">✨</span> {b}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                {msg.data.footer && (
                                    <div className="px-10 py-6 bg-gradient-to-r from-[#F26B21] to-[#FDB913] rounded-full inline-block shadow-lg">
                                        <p className="text-4xl font-black uppercase text-black">{msg.data.footer}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 11. OUTRO */}
                        {msg.type === 'outro' && (
                            <div className="text-center w-full relative z-10">
                                <h1 className="text-7xl font-black text-[#FDB913] mb-12 uppercase drop-shadow-md">{msg.content.title}</h1>

                                <div className="grid grid-cols-3 gap-4 mb-14">
                                    {msg.content.stats.map((s, i) => (
                                        <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10">
                                            <p className="text-3xl font-black leading-tight">{s.split(' ')[0]}</p>
                                            <p className="text-xl uppercase text-gray-300">{s.split(' ')[1]}</p>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-4xl font-medium leading-relaxed mb-12 max-w-3xl mx-auto">
                                    {msg.content.body}
                                </p>

                                <div className="bg-[#4a1d75] rounded-3xl p-10 mb-12 border border-[#F26B21]/50 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-50"><Trophy size={100} className="text-[#F26B21]" /></div>
                                    <h3 className="text-4xl font-black text-[#FDB913] uppercase mb-8 relative z-10 text-left">🔥 PRÓXIMAMENTE:</h3>
                                    <ul className="space-y-4 text-left relative z-10">
                                        {msg.content.future.map((item, i) => (
                                            <li key={i} className="text-3xl flex items-center gap-4">
                                                <span className="text-[#F26B21]">→</span> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-3xl font-bold uppercase">{msg.content.callToAction}</p>
                                    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                                        {msg.content.actions.map((act, i) => (
                                            <div key={i} className="bg-white text-[#2a0a45] font-black text-2xl py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-transform">
                                                {act}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-16 text-6xl font-black text-[#F26B21] uppercase tracking-tighter">{msg.content.final}</p>
                            </div>
                        )}

                    </div>

                    {/* Footer Branding */}
                    <div className="absolute bottom-10 w-full text-center opacity-50">
                        <p className="text-2xl font-bold tracking-[0.2em]">@CENTAUROADS</p>
                    </div>
                </div>
            </div>

            <p className="text-gray-400 text-sm max-w-2xl text-center">
                * Las imágenes se generan en alta resolución (1080x1920) listas para subir a Instagram Stories.
                Haz clic en "Descargar PNG" para guardar la plantilla actual.
            </p>
        </div>
    );
}

// Icons (Quick fix for missing imports if needed, assuming Lucide supports them)
const UserCheckIcon = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
    </svg>
);
const SearchIcon = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
