import React from 'react';
import Link from 'next/link';
import PublicResults from '@/components/ui/PublicResults';
import { Sparkles, Video, Trophy, ArrowRight, Gamepad2, Monitor, CheckCircle2 } from 'lucide-react';
import JurySection from '@/components/ui/JurySection';
import CountdownTimer from '@/components/ui/CountdownTimer';
import ParticipantsCounter from '@/components/ui/ParticipantsCounter';

import { prisma } from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LandingPage() {
  noStore();
  const statusSetting = await prisma.contestSetting.findUnique({ where: { key: 'CONTEST_IS_CLOSED' } });
  const isClosed = statusSetting?.value === 'true';
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-red-600/10 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <CountdownTimer />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest animate-pulse">
            Convocatoria 2025 • Caracas, Venezuela
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
            TU ARTE 3D <br /> VENEZOLANO
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-white tracking-widest uppercase">
            En la Pantalla de Chacao
          </p>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Participa en el concurso de 3D/motion graphics más importante del año. Los mejores Santa Venezolanos animados, dominarán la pantalla LED más mágica de la ciudad.
          </p>
          <p className="text-red-400 font-bold text-lg mt-4 animate-pulse">
            El plazo es hasta el 30 de Diciembre 2025 a la media noche
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {!isClosed ? (
              <Link href="/registro" className="w-full sm:w-auto px-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 group">
                Postular mi Video
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div className="w-full sm:w-auto px-10 py-5 bg-gray-600 text-gray-300 rounded-2xl font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-3 shadow-none">
                Convocatoria Cerrada
              </div>
            )}
            <a href="#ranking" className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest transition-all">
              Ver Ranking
            </a>
          </div>
        </div>
      </section>
      <ParticipantsCounter />
      <section className="max-w-7xl mx-auto px-4 py-20 border-t border-white/5" id="premios">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Monitor className="text-blue-400" />, title: "Formato Vertical", desc: "Resolución exacta de 1024x1792 para el kiosko de Chacao." },
            { icon: <Gamepad2 className="text-red-400" />, title: "Creatividad 3D", desc: "Uso libre de software (Blender, C4D, Unreal Engine)." },
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
