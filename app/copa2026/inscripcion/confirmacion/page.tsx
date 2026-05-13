'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function ConfirmacionInscripcionPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [conformidad, setConformidad] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error' | 'cooldown'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Para propósitos de desarrollo/UI mock, usamos un email dummy o podemos buscarlo en localStorage si el wizard lo guarda.
    const savedEmail = sessionStorage.getItem('copa2026_registered_email') || 'participante@email.com';
    setEmail(savedEmail);

    const savedConformidad = sessionStorage.getItem('copa2026_conformidad_mensaje');
    if (savedConformidad) setConformidad(savedConformidad);

    const lastResend = sessionStorage.getItem('copa2026_last_resend');
    if (lastResend) {
      const timePassed = Date.now() - parseInt(lastResend);
      if (timePassed < 5 * 60 * 1000) {
        setResendStatus('cooldown');
        setTimeLeft(Math.ceil((5 * 60 * 1000 - timePassed) / 1000));
      }
    }
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setResendStatus('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleResend = async () => {
    if (!email || resendStatus === 'cooldown') return;
    
    setIsResending(true);
    setResendStatus('idle');
    try {
      // Mock API call
      // await axios.post('/api/copa2026/inscripcion/reenviar-email', { email });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setResendStatus('success');
      sessionStorage.setItem('copa2026_last_resend', Date.now().toString());
      setTimeLeft(5 * 60);
      setTimeout(() => setResendStatus('cooldown'), 3000);
    } catch (error) {
      console.error(error);
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <Card className="max-w-xl w-full text-center p-8 md:p-12 bg-[#0a0a0a] border-white/10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-brand-purple/20 flex items-center justify-center border-4 border-brand-purple">
            <CheckCircle2 size={48} className="text-brand-purple" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tighter">
          ¡Inscripción Exitosa!
        </h1>
        
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8 text-left">
          <p className="text-gray-300 text-lg mb-4 text-center">
            Tu pago ha sido validado correctamente.
          </p>
          {conformidad && (
            <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center justify-center gap-3">
              <CheckCircle2 size={24} className="text-green-500 shrink-0" />
              <p className="text-green-400 font-medium text-sm text-center">
                {conformidad}
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="text-brand-purple shrink-0 mt-1" size={20} />
              <div>
                <p className="font-bold text-white">Revisa tu correo electrónico</p>
                <p className="text-sm text-gray-400">
                  Hemos enviado un email a <strong className="text-white">{email}</strong> con tu Enlace Privado de Carga. Necesitarás este enlace para subir tu video antes del cierre del concurso.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-white text-black hover:bg-gray-200 font-black py-4 px-6 rounded-xl uppercase tracking-widest transition-colors"
          >
            Volver al Inicio
          </button>
          
          <button
            onClick={handleResend}
            disabled={isResending || resendStatus === 'cooldown'}
            className="w-full bg-[#111] text-gray-300 border border-white/10 hover:bg-white/5 font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isResending ? 'Enviando...' : 
             resendStatus === 'cooldown' ? `Reenviar correo (Espera ${formatTime(timeLeft)})` : 
             'Reenviar correo de confirmación'}
          </button>
          
          {resendStatus === 'success' && (
            <p className="text-green-500 text-sm font-medium animate-in fade-in flex items-center justify-center gap-1">
              <CheckCircle2 size={16} /> Correo enviado correctamente
            </p>
          )}
          {resendStatus === 'error' && (
            <p className="text-red-500 text-sm font-medium animate-in fade-in flex items-center justify-center gap-1">
              <AlertCircle size={16} /> Error al enviar el correo
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
