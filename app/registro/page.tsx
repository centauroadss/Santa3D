'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RegistrationForm from '@/components/forms/RegistrationForm';
import VideoUpload from '@/components/forms/VideoUpload';
import Card from '@/components/ui/Card';
import Countdown from '@/components/ui/Countdown';
import axios from 'axios';

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'upload' | 'success'>('register');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantData, setParticipantData] = useState<any>(null);

  const [isContestClosed, setIsContestClosed] = useState(false);
  const [closedAt, setClosedAt] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await axios.get('/api/public/contest-status');
      if (res.data.isClosed) {
        setIsContestClosed(true);
        setClosedAt(res.data.closedAt);
      }
    } catch (error) {
      console.error('Error checking status', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleRegistrationSuccess = (data: any) => {
    setParticipantId(data.participantId);
    setParticipantData(data);
    setStep('upload');
  };
  const handleUploadSuccess = () => {
    setStep('success');
  };

  if (loadingStatus) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Cargando...</div>;

  if (isContestClosed) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-xl w-full text-center p-12">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Concurso Cerrado</h1>
          <p className="text-gray-600 text-lg mb-8">
            El periodo de postulaciones ha finalizado el {closedAt ? new Date(closedAt).toLocaleString() : ''}.
            <br />
            ¡Gracias a todos por participar!
          </p>
          <div className="bg-purple-50 p-6 rounded-lg mb-8">
            <p className="font-bold text-brand-purple mb-2">¿Ya participaste?</p>
            <p className="text-sm text-purple-700">Mantente atento a nuestras redes sociales para los resultados.</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Volver al Inicio
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            🎄 Registro - Concurso Santa 3D
          </h1>
          <p className="text-gray-600 mb-6">@centauroads</p>
          {/* Header Info */}
          <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-8 shadow-xl">
            <div className="mb-6">
              <p className="text-xl md:text-2xl font-black text-red-600 uppercase tracking-widest selection:bg-red-200">
                Fecha de Cierre: 30/12/2025
              </p>
              <p className="text-lg md:text-xl font-bold text-gray-700">
                Hasta la medianoche
              </p>
            </div>
            {/* Dynamic Status */}
            <div className="mb-8">
              <div className="inline-block animate-pulse">
                <span className="bg-green-100 text-green-700 border-2 border-green-500 px-6 py-2 rounded-full text-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                  🟢 Concurso Abierto
                </span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-widest">Tiempo Restante</p>
            <Countdown deadline="2025-12-30T23:59:59" />
          </div>
        </div>
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step === 'register' ? 'text-brand-purple' : step === 'upload' || step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'register' ? 'bg-brand-purple text-white' : step === 'upload' || step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {step === 'upload' || step === 'success' ? '✓' : '1'}
              </div>
              <span className="ml-2 font-semibold">Registro</span>
            </div>
            <div className="w-12 h-1 bg-gray-300">
              <div className={`h-full transition-all ${step === 'upload' || step === 'success' ? 'bg-green-600 w-full' : 'bg-transparent w-0'}`} />
            </div>
            <div className={`flex items-center ${step === 'upload' ? 'text-brand-purple' : step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'upload' ? 'bg-brand-purple text-white' : step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {step === 'success' ? '✓' : '2'}
              </div>
              <span className="ml-2 font-semibold">Video</span>
            </div>
            <div className="w-12 h-1 bg-gray-300">
              <div className={`h-full transition-all ${step === 'success' ? 'bg-green-600 w-full' : 'bg-transparent w-0'}`} />
            </div>
            <div className={`flex items-center ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                {step === 'success' ? '✓' : '3'}
              </div>
              <span className="ml-2 font-semibold">Listo</span>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="max-w-3xl mx-auto">
          {step === 'register' && (
            <Card title="📝 Datos del Participante" subtitle="Completa tus datos para participar">
              <RegistrationForm onSuccess={handleRegistrationSuccess} />
            </Card>
          )}
          {step === 'upload' && participantId && (
            <Card title="🎬 Sube tu Video" subtitle="Sube tu animación 3D del Santa Venezolano">
              <VideoUpload
                participantId={participantId}
                participantData={participantData}
                onSuccess={handleUploadSuccess}
              />
            </Card>
          )}
          {step === 'success' && (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  ¡Registro Completado!
                </h2>
                <p className="text-lg text-gray-600 mb-2">
                  Tu video ha sido subido exitosamente y está siendo validado.
                </p>
                <p className="text-gray-500 mb-8">
                  Recibirás un email de confirmación en breve.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <h3 className="font-bold text-blue-900 mb-3">📅 Próximos Pasos:</h3>
                  <ul className="text-left text-blue-800 space-y-2">
                    <li>• Los jueces evaluarán tu video del 30 al 31 de Diciembre</li>
                    <li>• El ganador se anunciará el 31 de Diciembre 2025</li>
                    <li>• Te notificaremos por email si resultas ganador</li>
                  </ul>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push('/')}
                    className="btn-primary"
                  >
                    Volver al Inicio
                  </button>
                  <a
                    href="https://instagram.com/centauroads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    Seguir @centauroads
                  </a>
                </div>
              </div>
            </Card>
          )}
        </div>
        {/* Back Button */}
        {step === 'register' && (
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-brand-purple transition-colors"
            >
              ← Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
