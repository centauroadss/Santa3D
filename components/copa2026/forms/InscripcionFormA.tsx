'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
    nombre: z.string().min(2, 'El nombre es obligatorio'),
    apellido: z.string().min(2, 'El apellido es obligatorio'),
    cedulaIdentidad: z.string().min(5, 'Cédula inválida (ej. V12345678)'),
    email: z.string().email('Email inválido'),
    telefono: z.string().regex(/^(412|422|414|424|416|426)[0-9]{7}$/, 'Teléfono inválido. Debe ser de 10 dígitos y empezar por 412, 422, 414, 424, 416 o 426'),
    instagram: z.string().regex(/^@/, 'Debe comenzar con @').min(2, 'Usuario inválido'),
    categoria: z.enum(['RENDER', 'IA', 'AMBAS'], { required_error: 'Selecciona una categoría' }),
    terminos: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' }) }),
    derechos: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la cesión de derechos' }) }),
});

export type FormAValues = z.infer<typeof formSchema>;

interface Props {
    onNext: (data: FormAValues) => void;
    defaultValues?: Partial<FormAValues>;
}

export function InscripcionFormA({ onNext, defaultValues }: Props) {
    const { register, handleSubmit, formState: { errors } } = useForm<FormAValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ...defaultValues,
            // defaults to avoid uncontrolled inputs warnings
            nombre: defaultValues?.nombre || '',
            apellido: defaultValues?.apellido || '',
            cedulaIdentidad: defaultValues?.cedulaIdentidad || '',
            email: defaultValues?.email || '',
            telefono: defaultValues?.telefono || '',
            instagram: defaultValues?.instagram || '',
        }
    });

    return (
        <form onSubmit={handleSubmit(onNext)} className="space-y-6 text-left">
            <h2 className="text-2xl font-bold text-white mb-6">Paso 1: Datos Personales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Nombre</label>
                    <input {...register('nombre')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Juan" />
                    {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Apellido</label>
                    <input {...register('apellido')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="Pérez" />
                    {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Cédula / RIF</label>
                    <input {...register('cedulaIdentidad')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="V12345678" />
                    {errors.cedulaIdentidad && <p className="text-red-500 text-xs mt-1">{errors.cedulaIdentidad.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Teléfono (10 dígitos sin el 0)</label>
                    <input {...register('telefono')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="4141234567" maxLength={10} />
                    {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Correo Electrónico</label>
                    <input {...register('email')} type="email" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="correo@ejemplo.com" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Usuario de Instagram</label>
                    <input {...register('instagram')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none" placeholder="@usuario" />
                    {errors.instagram && <p className="text-red-500 text-xs mt-1">{errors.instagram.message}</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Categoría a Participar</label>
                <select {...register('categoria')} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none">
                    <option value="">Selecciona una opción...</option>
                    <option value="RENDER">Render 3D Tradicional ($10)</option>
                    <option value="IA">Video con Inteligencia Artificial ($10)</option>
                    <option value="AMBAS">Ambas Categorías ($20)</option>
                </select>
                {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria.message}</p>}
            </div>

            <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input {...register('terminos')} id="terminos" type="checkbox" className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-red-500 focus:ring-red-500 focus:ring-offset-neutral-900" />
                    </div>
                    <label htmlFor="terminos" className="ml-2 text-sm text-neutral-400">
                        Acepto los términos y condiciones del concurso Copa Santa 3D 2026.
                    </label>
                </div>
                {errors.terminos && <p className="text-red-500 text-xs mt-1">{errors.terminos.message}</p>}

                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input {...register('derechos')} id="derechos" type="checkbox" className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-red-500 focus:ring-red-500 focus:ring-offset-neutral-900" />
                    </div>
                    <label htmlFor="derechos" className="ml-2 text-sm text-neutral-400">
                        Acepto la cesión de derechos de autor de mi obra para uso promocional del evento.
                    </label>
                </div>
                {errors.derechos && <p className="text-red-500 text-xs mt-1">{errors.derechos.message}</p>}
            </div>

            <div className="pt-6">
                <button type="submit" className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-bold text-white text-lg transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]">
                    Continuar al Pago
                </button>
            </div>
        </form>
    );
}
