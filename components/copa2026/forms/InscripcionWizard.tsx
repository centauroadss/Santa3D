'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InscripcionFormA, FormAValues } from './InscripcionFormA';
import { InscripcionFormB, FormBValues } from './InscripcionFormB';

interface Props {
    tasaBcv: number;
    bancos: { codigo: string; nombre: string }[];
    configPago: { telefono: string; cedula: string; banco: string };
}

export function InscripcionWizard({ tasaBcv, bancos, configPago }: Props) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [dataA, setDataA] = useState<FormAValues | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNext = (data: FormAValues) => {
        setDataA(data);
        setError(null);
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleSubmitFinal = async (dataB: FormBValues) => {
        if (!dataA) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...dataA,
                ...dataB,
                tasaBcv,
            };

            const response = await fetch('/api/copa2026/inscripcion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al procesar la inscripción');
            }

            // Redirigir a pantalla de confirmación
            // Guardar algunos datos en sessionStorage si queremos mostrarlos en la confirmación
            sessionStorage.setItem('copa2026_confirm_email', dataA.email);
            sessionStorage.setItem('copa2026_confirm_nombre', dataA.nombre);
            sessionStorage.setItem('copa2026_confirm_categoria', dataA.categoria);
            sessionStorage.setItem('copa2026_confirm_monto', dataB.montoDeclaradoBs);

            router.push('/copa2026/inscripcion/confirmacion');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const montoUsd = dataA?.categoria === 'AMBAS' ? 20 : 10;

    return (
        <div className="max-w-3xl mx-auto w-full bg-[#0a0a0a] border border-[#222] p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Steps indicator */}
            <div className="flex gap-2 mb-8">
                <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-red-500' : 'bg-neutral-800'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-red-500' : 'bg-neutral-800'}`}></div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
                    {error}
                </div>
            )}

            {step === 1 && (
                <InscripcionFormA 
                    onNext={handleNext} 
                    defaultValues={dataA || undefined} 
                />
            )}

            {step === 2 && dataA && (
                <InscripcionFormB
                    tasaBcv={tasaBcv}
                    montoUsd={montoUsd}
                    bancos={bancos}
                    configPago={configPago}
                    onBack={handleBack}
                    onSubmit={handleSubmitFinal}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}
