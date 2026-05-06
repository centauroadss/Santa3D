'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, UploadCloud, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre es muy corto'),
  apellido: z.string().min(2, 'El apellido es muy corto'),
  cedulaIdentidad: z.string().regex(/^[VEPvep]-?\d{1,9}$/, 'Debe empezar por V, E, o P seguido de máximo 9 números (Ej: V-12345678 o V12345678)'),
  email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'El email debe tener un @ y un dominio válido (ej. usuario@dominio.com)'),
  telefono: z.string().regex(/^(412|422|414|424|416|426)\d{7}$/, 'Debe tener 10 dígitos y empezar con un prefijo válido (ej: 412, 414, etc.) sin el 0'),
  instagram: z.string().regex(/^@[a-zA-Z0-9_.]+$/, 'Debe empezar con @').min(2, 'Requerido'),
  categoria: z.enum(['RENDER', 'IA', 'AMBAS'], {
    required_error: 'Debes seleccionar una categoría',
  }),
  aceptaTerminos: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' })
  }),
  cesionDerechos: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la cesión de derechos' })
  })
});

export type FormAData = z.infer<typeof formSchema> & { fotoPerfilFile?: File };

interface Props {
  initialData?: Partial<FormAData>;
  onSubmit: (data: FormAData) => void;
}

export default function InscripcionFormA({ initialData, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue } = useForm<FormAData>({
    resolver: zodResolver(formSchema),
    mode: 'all',
    defaultValues: {
      categoria: 'RENDER',
      ...initialData
    }
  });

  const selectedCategory = watch('categoria');
  const aceptaTerminos = watch('aceptaTerminos');
  const cesionDerechos = watch('cesionDerechos');
  const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(initialData?.fotoPerfilFile || null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFotoPerfilFile(acceptedFiles[0]);
      }
    }
  });

  const onFormSubmit = (data: any) => {
    onSubmit({ ...data, fotoPerfilFile: fotoPerfilFile! });
  };

  const isFormValid = isValid && fotoPerfilFile !== null && aceptaTerminos && cesionDerechos;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black uppercase text-white mb-2">Paso 1: Datos Personales</h2>
        <p className="text-gray-400">Ingresa tus datos para registrarte en el concurso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Nombre</label>
          <input
            {...register('nombre')}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
            placeholder="Tu nombre"
          />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Apellido</label>
          <input
            {...register('apellido')}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
            placeholder="Tu apellido"
          />
          {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Cédula de Identidad</label>
          <input
            {...register('cedulaIdentidad')}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors uppercase"
            placeholder="V-12345678"
          />
          {errors.cedulaIdentidad && <p className="text-red-500 text-xs mt-1">{errors.cedulaIdentidad.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Teléfono Móvil (Sin el 0)</label>
          <div className="flex">
            <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-white/10 bg-[#222] text-gray-400 font-bold">
              +58
            </span>
            <input
              {...register('telefono')}
              className="w-full bg-[#111] border border-white/10 rounded-r-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
              placeholder="4141234567"
              maxLength={10}
            />
          </div>
          {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Correo Electrónico</label>
          <input
            {...register('email')}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
            placeholder="tu@email.com"
            type="email"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Usuario de Instagram</label>
          <input
            {...register('instagram')}
            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
            placeholder="@tu_usuario"
          />
          {errors.instagram && <p className="text-red-500 text-xs mt-1">{errors.instagram.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-300 mb-4">Selecciona la Categoría</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['RENDER', 'IA', 'AMBAS'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setValue('categoria', cat as any, { shouldValidate: true })}
              className={`py-4 rounded-xl font-bold uppercase transition-all border ${
                selectedCategory === cat 
                  ? 'bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20' 
                  : 'bg-[#111] text-gray-400 border-white/10 hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {errors.categoria && <p className="text-red-500 text-xs mt-2">{errors.categoria.message}</p>}
      </div>

      <div className={!fotoPerfilFile ? "p-4 bg-red-500/5 rounded-2xl border border-red-500/20" : ""}>
        <label className="block text-sm font-bold text-gray-300 mb-2">Foto de Perfil (Solo rostros) *Requerido</label>
        <p className="text-xs text-gray-400 mb-3">La imagen debe mostrar claramente tu rostro humano (una sola persona). No paisajes, no animales.</p>
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-brand-purple bg-brand-purple/10' : 
            fotoPerfilFile ? 'border-green-500 bg-green-500/5' : 'border-red-500/50 hover:border-brand-purple bg-[#111]'
          }`}
        >
          <input {...getInputProps()} />
          {fotoPerfilFile ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="text-green-500" size={32} />
              <p className="text-white font-bold">{fotoPerfilFile.name}</p>
              <p className="text-green-500 text-sm">Foto adjunta correctamente</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="text-red-400" size={32} />
              <p className="text-red-300 font-medium">DEBES ADJUNTAR TU FOTO DE PERFIL AQUÍ</p>
              <p className="text-gray-500 text-sm">Arrastra o haz clic. JPEG o PNG hasta 5MB</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-white/10">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="mt-1 flex-shrink-0">
            <input type="checkbox" {...register('aceptaTerminos')} className="w-5 h-5 accent-brand-purple" />
          </div>
          <span className="text-sm text-gray-400 group-hover:text-gray-300">
            He leído y acepto los <a href="#" className="text-brand-purple hover:underline">Términos y Condiciones</a> del concurso Copa 2026.
          </span>
        </label>
        {errors.aceptaTerminos && <p className="text-red-500 text-xs ml-8">{errors.aceptaTerminos.message}</p>}

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="mt-1 flex-shrink-0">
            <input type="checkbox" {...register('cesionDerechos')} className="w-5 h-5 accent-brand-purple" />
          </div>
          <span className="text-sm text-gray-400 group-hover:text-gray-300">
            Acepto la cesión de derechos de autor para la exhibición pública de la obra en caso de resultar seleccionada.
          </span>
        </label>
        {errors.cesionDerechos && <p className="text-red-500 text-xs ml-8">{errors.cesionDerechos.message}</p>}
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors ${
            isFormValid 
            ? 'bg-white text-black hover:bg-gray-200 cursor-pointer' 
            : 'bg-[#222] text-gray-600 border border-gray-800 cursor-not-allowed opacity-70'
          }`}
        >
          {isFormValid ? 'Siguiente Paso: Pago' : 'Completa todos los datos'} <ArrowRight size={20} />
        </button>
        {!isFormValid && (
          <p className="text-center text-red-400 text-sm mt-3 font-medium">
            Debe completar correctamente todos los campos, adjuntar la foto y aceptar los términos para habilitar el botón.
          </p>
        )}
      </div>
    </form>
  );
}
