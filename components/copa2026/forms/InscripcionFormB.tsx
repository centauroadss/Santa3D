'use client';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, ChevronLeft, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
  telefonoPago: z.string().regex(/^(?:\+58|0)?(412|422|414|424|416|426)\d{7}$/, 'Debe empezar con +58 o 0 seguido del prefijo válido (ej: +58412..., 0414...) y tener 10 dígitos'),
  cedulaPago: z.string().regex(/^[VEPvep]-?\d{1,9}$/, 'Debe empezar por V, E, o P seguido de máximo 9 números (Ej: V-12345678)'),
  bancoOrigen: z.string().min(4, 'Selecciona un banco'),
  referencia: z.string().min(4, 'Ingresa los últimos dígitos de referencia'),
  comprobanteFile: z.any().refine((file) => file != null, 'Debes subir un comprobante')
});

export type FormBData = z.infer<typeof formSchema>;

interface Props {
  initialData?: Partial<FormBData>;
  onBack: () => void;
  onSubmit: (data: FormBData) => void;
  isLoading?: boolean;
  tasaBcv: number;
  costoUnaCategoria: number;
  costoAmbasCategorias: number;
  categoria: 'RENDER' | 'IA' | 'AMBAS';
  configPago: {
    banco: string;
    cedula: string;
    telefono: string;
  };
}

// Simulamos los bancos para el frontend
const BANCOS_MOCK = [
  { codigo: '0102', nombre: 'Banco de Venezuela' },
  { codigo: '0104', nombre: 'Banco Venezolano de Crédito' },
  { codigo: '0105', nombre: 'Banco Mercantil' },
  { codigo: '0108', nombre: 'Banco Provincial' },
  { codigo: '0134', nombre: 'Banesco' },
  { codigo: '0151', nombre: 'BFC Banco Fondo Común' },
  { codigo: '0156', nombre: '100% Banco' },
  { codigo: '0171', nombre: 'Banco Activo' },
  { codigo: '0172', nombre: 'Bancamiga' },
  { codigo: '0191', nombre: 'BNC Nacional de Crédito' },
];

export default function InscripcionFormB({ 
  initialData, 
  onBack, 
  onSubmit, 
  isLoading, 
  tasaBcv, 
  costoUnaCategoria = 5, 
  costoAmbasCategorias = 10, 
  categoria, 
  configPago = { banco: 'Banesco', cedula: 'J-123456789', telefono: '04140000000' } 
}: Props) {
  const [file, setFile] = useState<File | null>(initialData?.comprobanteFile || null);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormBData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setValue('comprobanteFile', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const MONTO_USD = categoria === 'AMBAS' ? costoAmbasCategorias : costoUnaCategoria;
  const MONTO_BS = (tasaBcv * MONTO_USD).toFixed(2);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black uppercase text-white mb-2">Paso 2: Validación de Pago</h2>
        <p className="text-gray-400">Transfiere el monto exacto y adjunta el comprobante</p>
      </div>

      <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-2xl p-6 text-center">
        <h3 className="text-sm text-brand-purple font-bold uppercase tracking-widest mb-4">Monto a Pagar Hoy</h3>
        <div className="text-5xl font-black text-white mb-2">{MONTO_BS} Bs.</div>
        <p className="text-sm text-gray-400 font-mono">USD{MONTO_USD} x T/C BCV {tasaBcv} Bs/USD</p>

        
        <div className="mt-6 pt-6 border-t border-brand-purple/20 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Banco</p>
            <p className="text-white font-medium">{configPago?.banco}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Teléfono</p>
            <p className="text-white font-medium">{configPago?.telefono}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Cédula/RIF</p>
            <p className="text-white font-medium">{configPago?.cedula}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Datos del Pagador (Origen)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Banco de Origen</label>
            <select
              {...register('bancoOrigen')}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors appearance-none"
            >
              <option value="">Selecciona un banco</option>
              {BANCOS_MOCK.map(b => (
                <option key={b.codigo} value={b.codigo}>{b.codigo} - {b.nombre}</option>
              ))}
            </select>
            {errors.bancoOrigen && <p className="text-red-500 text-xs mt-1">{errors.bancoOrigen.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Teléfono de Origen (Sin el 0)</label>
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-white/10 bg-[#222] text-gray-400 font-bold">
                +58
              </span>
              <input
                {...register('telefonoPago')}
                className="w-full bg-[#111] border border-white/10 rounded-r-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
                placeholder="4141234567"
                maxLength={10}
              />
            </div>
            {errors.telefonoPago && <p className="text-red-500 text-xs mt-1">{errors.telefonoPago.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Cédula del Pagador</label>
            <input
              {...register('cedulaPago')}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors uppercase"
              placeholder="V-12345678"
            />
            {errors.cedulaPago && <p className="text-red-500 text-xs mt-1">{errors.cedulaPago.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Nro. de Referencia</label>
            <input
              {...register('referencia')}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
              placeholder="Últimos 6 dígitos"
            />
            {errors.referencia && <p className="text-red-500 text-xs mt-1">{errors.referencia.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Sube tu Comprobante</label>
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-brand-purple bg-brand-purple/5' : 'border-white/20 hover:border-white/40 bg-[#111]'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="text-green-500" size={32} />
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">Haz clic para cambiar el archivo</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <UploadCloud size={32} className="mb-2" />
                <p className="text-sm font-medium"><span className="text-brand-purple font-bold">Haz clic para subir</span> o arrastra y suelta</p>
                <p className="text-xs text-gray-500">PNG, JPG o PDF (Max. 5MB)</p>
              </div>
            )}
          </div>
          {errors.comprobanteFile && <p className="text-red-500 text-xs mt-1">{errors.comprobanteFile?.message?.toString()}</p>}
        </div>

        <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-6 text-center">
          <p className="text-red-500 font-black text-xl uppercase mb-2">¡NOTA IMPORTANTE!</p>
          <p className="text-red-400 font-bold text-sm md:text-base">
            El campo "Concepto", "Descripción" u "Observación" de tu transferencia 
            SIEMPRE debe contener el NOMBRE y número de CÉDULA del participante.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-1/3 px-6 py-4 bg-[#222] hover:bg-[#333] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors uppercase text-sm tracking-widest"
        >
          <ChevronLeft size={20} /> Atrás
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full sm:w-2/3 px-6 py-4 font-black uppercase tracking-widest rounded-xl flex items-center justify-center transition-all ${
            isLoading 
              ? 'bg-brand-purple/50 cursor-not-allowed text-white/50'
              : 'bg-gradient-to-r from-brand-purple to-pink-500 hover:opacity-90 text-white shadow-lg shadow-brand-purple/20'
          }`}
        >
          {isLoading ? 'Procesando Validación...' : 'Confirmar Inscripción'}
        </button>
      </div>
    </form>
  );
}
