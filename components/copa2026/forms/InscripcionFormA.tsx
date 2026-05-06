'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight } from 'lucide-react';

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre es muy corto'),
  apellido: z.string().min(2, 'El apellido es muy corto'),
  cedulaIdentidad: z.string().regex(/^[VEJP]-\d+$/, 'Formato inválido (Ej: V-12345678)'),
  email: z.string().email('Email inválido'),
  telefono: z.string().regex(/^(412|422|414|424|416|426)\d{7}$/, 'Debe tener 10 dígitos y empezar con un prefijo válido (ej: 412, 414, etc.) sin el 0'),
  instagram: z.string().regex(/^@[\w.]+$/, 'Debe empezar con @').optional(),
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

export type FormAData = z.infer<typeof formSchema>;

interface Props {
  initialData?: Partial<FormAData>;
  onSubmit: (data: FormAData) => void;
}

export default function InscripcionFormA({ initialData, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormAData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoria: 'RENDER',
      ...initialData
    }
  });

  const selectedCategory = watch('categoria');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          className="w-full bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          Siguiente Paso: Pago <ArrowRight size={20} />
        </button>
      </div>
    </form>
  );
}
