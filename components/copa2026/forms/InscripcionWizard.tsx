'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import InscripcionFormA, { FormAData } from './InscripcionFormA';
import InscripcionFormB, { FormBData } from './InscripcionFormB';
import axios from 'axios';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900 text-white rounded-xl">
          <h2 className="font-bold text-xl mb-2">Error de Renderizado:</h2>
          <pre className="text-xs whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          <pre className="text-xs whitespace-pre-wrap mt-2 text-gray-400">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

type Step = 'A' | 'B';

interface Props {
  tasaBcv: number;
  costoUnaCategoria: number;
  costoAmbasCategorias: number;
  configPago: {
    banco: string;
    cedula: string;
    telefono: string;
  }
}

export default function InscripcionWizard({ 
  tasaBcv, 
  costoUnaCategoria = 5, 
  costoAmbasCategorias = 10, 
  configPago = { banco: 'Banesco', cedula: 'J-123456789', telefono: '04140000000' } 
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('A');
  const [formDataA, setFormDataA] = useState<Partial<FormAData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormASubmit = (data: FormAData) => {
    setFormDataA(data);
    setStep('B');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleFormBSubmit = async (dataB: FormBData) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      
      // Datos Form A
      Object.entries(formDataA).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value.toString());
      });

      // Datos Form B
      formData.append('telefonoPago', dataB.telefonoPago);
      formData.append('cedulaPago', dataB.cedulaPago);
      formData.append('bancoOrigen', dataB.bancoOrigen);
      formData.append('referencia', dataB.referencia);
      formData.append('comprobanteFile', dataB.comprobanteFile);

      // Llamada real a la API (Fase Backend)
      await axios.post('/api/copa2026/inscripcion', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Redirigir a pantalla de confirmación
      router.push('/copa2026/inscripcion/confirmacion');
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Ocurrió un error al procesar tu inscripción. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#222] -z-10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-purple transition-all duration-500"
              style={{ width: step === 'A' ? '50%' : '100%' }}
            />
          </div>
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
            step === 'A' || step === 'B' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/50' : 'bg-[#222] text-gray-500'
          }`}>
            1
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
            step === 'B' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/50' : 'bg-[#222] text-gray-500'
          }`}>
            2
          </div>
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mt-2 px-1">
          <span className={step === 'A' || step === 'B' ? 'text-brand-purple' : ''}>Tus Datos</span>
          <span className={step === 'B' ? 'text-brand-purple' : ''}>Validación de Pago</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-sm text-center font-medium">
          {error}
        </div>
      )}

      {/* Forms Content */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {step === 'A' && (
          <div className="animate-in slide-in-from-left fade-in duration-300">
            <InscripcionFormA 
              initialData={formDataA} 
              onSubmit={handleFormASubmit} 
            />
          </div>
        )}
        
        {step === 'B' && (
          <div className="animate-in slide-in-from-right fade-in duration-300">
            <ErrorBoundary>
              <InscripcionFormB 
                tasaBcv={tasaBcv}
                costoUnaCategoria={costoUnaCategoria}
                costoAmbasCategorias={costoAmbasCategorias}
                categoria={formDataA.categoria as 'RENDER' | 'IA' | 'AMBAS' || 'RENDER'}
                configPago={configPago}
                onBack={() => {
                  setStep('A');
                  setError(null);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
                onSubmit={handleFormBSubmit}
                isLoading={isLoading}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
