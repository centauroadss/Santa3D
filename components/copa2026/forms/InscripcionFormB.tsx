'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';

export const formBSchema = z.object({
    telefonoPago: z.string().regex(/^(412|422|414|424|416|426)[0-9]{7}$/, 'Teléfono inválido. Debe ser de 10 dígitos.'),
    cedulaPago: z.string().regex(/^[VEJP]-?\d{6,9}$/i, 'Cédula inválida (ej. V12345678)'),
    bancoPagoCodigo: z.string().min(4, 'Selecciona un banco'),
    montoDeclaradoBs: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, { message: 'Monto inválido' }),
    comprobanteBase64: z.string().min(1, 'Debes subir un comprobante de pago'),
});

export type FormBValues = z.infer<typeof formBSchema>;

interface Props {
    tasaBcv: number;
    montoUsd: number;
    bancos: { codigo: string; nombre: string }[];
    configPago: { telefono: string; cedula: string; banco: string };
    onBack: () => void;
    onSubmit: (data: FormBValues) => void;
    isSubmitting: boolean;
}

export function InscripcionFormB({ tasaBcv, montoUsd, bancos, configPago, onBack, onSubmit, isSubmitting }: Props) {
    const montoBsEsperado = (tasaBcv * montoUsd).toFixed(2);
    const [preview, setPreview] = useState<string | null>(null);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormBValues>({
        resolver: zodResolver(formBSchema),
        defaultValues: {
            montoDeclaradoBs: montoBsEsperado, // Default to expected
        }
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                setPreview(base64);
                setValue('comprobanteBase64', base64, { shouldValidate: true });
            };
            reader.readAsDataURL(file);
        }
    }, [setValue]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024, // 5MB
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
            <h2 className="text-2xl font-bold text-white mb-6">Paso 2: Confirmación de Pago</h2>
            
            {/* INSTRUCCIONES DE PAGO */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
                <h3 className="text-red-500 font-semibold mb-2">Realiza tu pago móvil a esta cuenta:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-neutral-400">Banco:</div>
                    <div className="text-white font-medium">{configPago.banco}</div>
                    <div className="text-neutral-400">Teléfono:</div>
                    <div className="text-white font-medium">{configPago.telefono}</div>
                    <div className="text-neutral-400">Cédula / RIF:</div>
                    <div className="text-white font-medium">{configPago.cedula}</div>
                    
                    <div className="col-span-2 my-2 border-t border-neutral-800"></div>
                    
                    <div className="text-neutral-400">Monto Inscripción:</div>
                    <div className="text-white font-medium">${montoUsd} USD</div>
                    <div className="text-neutral-400">Tasa BCV del Día:</div>
                    <div className="text-white font-medium">Bs. {tasaBcv.toFixed(4)}</div>
                    <div className="text-neutral-400 font-bold text-lg mt-1">Monto Exacto a Pagar:</div>
                    <div className="text-red-500 font-bold text-xl mt-1">Bs. {montoBsEsperado}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Banco Origen</label>
                    <select {...register('bancoPagoCodigo')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none">
                        <option value="">Selecciona tu banco...</option>
                        {bancos.map(b => (
                            <option key={b.codigo} value={b.codigo}>{b.codigo} - {b.nombre}</option>
                        ))}
                    </select>
                    {errors.bancoPagoCodigo && <p className="text-red-500 text-xs mt-1">{errors.bancoPagoCodigo.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Teléfono Origen (10 dígitos)</label>
                    <input {...register('telefonoPago')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="4141234567" maxLength={10} />
                    {errors.telefonoPago && <p className="text-red-500 text-xs mt-1">{errors.telefonoPago.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Cédula Origen</label>
                    <input {...register('cedulaPago')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="V12345678" />
                    {errors.cedulaPago && <p className="text-red-500 text-xs mt-1">{errors.cedulaPago.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Monto Enviado (Bs)</label>
                    <input {...register('montoDeclaradoBs')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="0.00" />
                    {errors.montoDeclaradoBs && <p className="text-red-500 text-xs mt-1">{errors.montoDeclaradoBs.message}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Comprobante de Pago (Capture)</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-red-500 bg-red-500/10' : 'border-neutral-700 bg-neutral-900 hover:border-neutral-500'}`}>
                    <input {...getInputProps()} />
                    {preview ? (
                        <div className="space-y-4">
                            <img src={preview} alt="Preview" className="mx-auto h-32 object-contain rounded" />
                            <p className="text-sm text-red-400">Clic o arrastra para cambiar la imagen</p>
                        </div>
                    ) : (
                        <div className="space-y-2 py-4">
                            <div className="mx-auto w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mb-3">
                                <span className="text-2xl">📸</span>
                            </div>
                            <p className="text-white font-medium">Sube el comprobante o arrástralo aquí</p>
                            <p className="text-neutral-500 text-sm">Formatos soportados: JPG, PNG, WEBP (Max 5MB)</p>
                        </div>
                    )}
                </div>
                {errors.comprobanteBase64 && <p className="text-red-500 text-xs mt-1">{errors.comprobanteBase64.message}</p>}
            </div>

            <div className="flex gap-4 pt-6">
                <button type="button" onClick={onBack} disabled={isSubmitting} className="px-6 py-4 bg-neutral-800 rounded-full font-bold text-white transition-all hover:bg-neutral-700 disabled:opacity-50">
                    Atrás
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-bold text-white text-lg transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Procesando y Validando Pago...
                        </>
                    ) : 'Finalizar Inscripción'}
                </button>
            </div>
        </form>
    );
}
