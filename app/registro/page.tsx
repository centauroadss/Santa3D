import React from 'react';
import InscripcionWizard from '@/components/copa2026/forms/InscripcionWizard';
import Countdown from '@/components/ui/Countdown';
import { prisma } from '@/lib/prisma';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RegistroPage() {
  const statusSetting = await prisma.contestSetting.findUnique({ where: { key: 'CONTEST_IS_CLOSED' } });
  const isClosed = statusSetting?.value === 'true';

  // Obtener Tasa BCV (Mock o desde BD)
  const bcvRecord = await prisma.tasaBcvHistorico.findFirst({
    orderBy: { fecha: 'desc' }
  });
  const tasaBcv = bcvRecord ? parseFloat(bcvRecord.tasaUsdBs.toString()) : 55.45; // Fallback
  // Obtener Configuración Dinámica de Costos y Banco
  const configs = await prisma.configConcurso.findMany({
    where: {
      clave: { in: ['costo_una_categoria', 'costo_ambas_categorias', 'pago_banco', 'pago_cedula', 'pago_telefono'] }
    }
  });

  const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);
  const costoUnaCategoria = parseFloat(configMap['costo_una_categoria'] || '5');
  const costoAmbasCategorias = parseFloat(configMap['costo_ambas_categorias'] || '10');
  
  const configPago = {
    banco: configMap['pago_banco'] || 'Banesco',
    cedula: configMap['pago_cedula'] || 'J-123456789',
    telefono: configMap['pago_telefono'] || '04140000000'
  };

  if (isClosed) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <Card className="max-w-xl w-full text-center p-12 bg-[#111] border-white/10">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-4">Concurso Cerrado</h1>
          <p className="text-gray-400 text-lg mb-8">
            El periodo de postulaciones ha finalizado.
          </p>
          <Link
            href="/"
            className="w-full inline-block bg-brand-purple text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-80 transition-colors"
          >
            Volver al Inicio
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] py-12 text-white">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-pink-500 mb-2 uppercase tracking-tight">
            Inscripción Oficial
          </h1>
          <p className="text-gray-400 mb-8 font-medium">Copa 2026 - Arte 3D Venezolano</p>
          
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8 inline-block shadow-2xl">
            <div className="mb-4">
              <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest animate-pulse">
                🟢 Inscripciones Abiertas
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Tiempo Restante para Inscribirse</p>
            <Countdown deadline="2026-06-05T23:59:59" />
          </div>
        </div>

        {/* Wizard */}
        <InscripcionWizard 
          tasaBcv={tasaBcv} 
          costoUnaCategoria={costoUnaCategoria}
          costoAmbasCategorias={costoAmbasCategorias}
          configPago={configPago}
        />
      </div>
    </div>
  );
}
