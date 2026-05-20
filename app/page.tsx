import React from 'react';
import Link from 'next/link';
import PublicResults from '@/components/ui/PublicResults';
import { Sparkles, Video, Trophy, ArrowRight, Gamepad2, Monitor, CheckCircle2 } from 'lucide-react';
import JurySection from '@/components/ui/JurySection';
import CountdownTimer from '@/components/ui/CountdownTimer';
import ParticipantsCounter from '@/components/ui/ParticipantsCounter';
import GatewayButtons from '@/components/ui/GatewayButtons';

import { prisma } from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LandingPage() {
  noStore();
  const statusSetting = await prisma.configConcurso.findMany({
    where: {
      clave: {
        in: ['CONTEST_IS_CLOSED', 'fecha_fin_concurso']
      }
    }
  });

  const configMap = statusSetting.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);
  const isClosed = configMap['CONTEST_IS_CLOSED'] === 'true';
  const fechaFinConcurso = configMap['fecha_fin_concurso'] || '2026-06-20T23:59:59';
  const fechaLimiteVotacion = configMap['fecha_limite_votacion'] || '2026-06-15T23:59:59';
  
  const videoCount = await prisma.videoCopa2026.count({ where: { estatus: 'APROBADO' } });
  const hasVideos = videoCount > 0;

  // Determine if voting is closed
  const votingClosed = new Date() > new Date(fechaLimiteVotacion);

  // Format date text
  const dateObj = new Date(fechaFinConcurso);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = dateObj.toLocaleDateString('es-VE', options);
  const deadlineText = `El plazo es hasta el ${formattedDate} a la media noche`;

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#f48240]/30">
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#f48240]/10 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <CountdownTimer deadline={fechaFinConcurso} deadlineText={deadlineText} />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f48240]/10 border border-[#f48240]/20 text-[#f48240] text-xs font-black uppercase tracking-widest animate-pulse">
            Convocatoria 2026 • Caracas, Venezuela
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-[#f48240] to-white">
            CONCURSO CREATIVO:<br />FUTBOL ART 3D
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-[#7b46a9] tracking-widest uppercase">
            2DA EDICIÓN
          </p>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Participa en el concurso de 3D y motion graphics más importante del año. Demuestra tu talento en las categorías Render e Inteligencia Artificial.
          </p>
          <p className="text-[#f48240] font-bold text-lg mt-4 animate-pulse">
            {deadlineText}
          </p>
          <GatewayButtons isClosed={isClosed} hasVideos={hasVideos} votingClosed={votingClosed} />
        </div>
      </section>
      <ParticipantsCounter />
      <section className="max-w-7xl mx-auto px-4 py-20 border-t border-white/5" id="premios">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Monitor className="text-[#7b46a9]" />, title: "Formato Vertical", desc: "Resolución exacta de 1024x1792 para el kiosko de Chacao." },
            { icon: <Gamepad2 className="text-[#f48240]" />, title: "Creatividad", desc: "Uso libre de software (Blender, C4D, IA Generativa)." },
            { icon: <Trophy className="text-amber-400" />, title: "Gran Premio", desc: "Exposición masiva y premios en metálico para el top 3." }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-[#080808] py-24" id="ranking">
        <div className="max-w-7xl mx-auto px-4 mb-12 text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Resultados en Tiempo Real</h2>
          <p className="text-gray-500 mt-2">Sigue de cerca quién lidera la tabla de posiciones.</p>
        </div>
        <PublicResults />
      </section>
      <JurySection />
    </main>
  );
}
