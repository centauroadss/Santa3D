/**
 * InscripcionFormA — Paso 1: datos del participante.
 *
 * Cambios respecto a la versión anterior:
 *   ★ Cálculo automático de edad a partir de fechaNacimiento.
 *   ★ Nuevo checkbox `confirmaMayoriaEdad` con label dinámico
 *      "Declaro que tengo XX años y soy mayor de edad".
 *   ★ Nuevo campo `biografia` (≤ 250 chars) con contador en vivo.
 *   ★ El botón "Siguiente" queda inhabilitado hasta que los 3 checks
 *      (aceptaTerminos, cesionDerechos, confirmaMayoriaEdad) estén en true
 *      Y el resto del formulario sea válido.
 *   ★ Validación de email, instagram y teléfono delegada al módulo
 *      `lib/copa2026/validators`.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  isValidEmail,
  isValidInstagram,
  validateVenezuelanPhone,
  calculateAge,
  esMayorDeEdad,
  validateBiografia,
  BIOGRAFIA_MAX,
  EDAD_MINIMA,
} from '@/lib/copa2026/validators';

// ─── Schema ─────────────────────────────────────────────────────────────────

export const formASchema = z
  .object({
    nombre: z.string().min(2, 'El nombre es muy corto'),
    apellido: z.string().min(2, 'El apellido es muy corto'),
    cedulaIdentidad: z
      .string()
      .regex(/^[VEPvep]-?\d{1,9}$/, 'Debe empezar por V, E o P y tener números'),
    email: z.string().refine(isValidEmail, 'Email inválido (debe tener @ y dominio)'),
    telefono: z
      .string()
      .refine((v) => validateVenezuelanPhone(v).ok, {
        message: 'Número de teléfono inválido',
      }),
    instagram: z
      .string()
      .refine(isValidInstagram, 'Instagram debe empezar con @ y no tener espacios'),
    fechaNacimiento: z.string().min(1, 'Requerida'),
    categoria: z.enum(['RENDER', 'IA', 'AMBAS']),
    biografia: z
      .string()
      .refine((v) => validateBiografia(v).ok, {
        message: `Biografía requerida, máximo ${BIOGRAFIA_MAX} caracteres`,
      }),
    aceptaTerminos: z.literal(true, {
      errorMap: () => ({ message: 'Debe aceptar los términos' }),
    }),
    cesionDerechos: z.literal(true, {
      errorMap: () => ({ message: 'Debe aceptar la cesión de derechos' }),
    }),
    confirmaMayoriaEdad: z.literal(true, {
      errorMap: () => ({ message: 'Debe declarar ser mayor de edad' }),
    }),
    fotoPerfilFile: z
      .any()
      .refine((f) => f instanceof File, 'Debe cargar una fotografía'),
  })
  .refine((d) => esMayorDeEdad(d.fechaNacimiento), {
    message: `Debe tener al menos ${EDAD_MINIMA} años`,
    path: ['fechaNacimiento'],
  });

export type FormAData = z.infer<typeof formASchema>;

// ─── Componente ─────────────────────────────────────────────────────────────

interface Props {
  initialData?: Partial<FormAData>;
  onSubmit: (data: FormAData) => void;
}

export default function InscripcionFormA({ initialData, onSubmit }: Props) {
  const [nombre, setNombre] = useState(initialData?.nombre ?? '');
  const [apellido, setApellido] = useState(initialData?.apellido ?? '');
  const [cedulaIdentidad, setCedula] = useState(initialData?.cedulaIdentidad ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [telefono, setTelefono] = useState(initialData?.telefono ?? '');
  const [instagram, setInstagram] = useState(initialData?.instagram ?? '');
  const [fechaNacimiento, setFechaNac] = useState(initialData?.fechaNacimiento ?? '');
  const [categoria, setCategoria] = useState<'RENDER' | 'IA' | 'AMBAS'>(
    (initialData?.categoria as any) ?? 'RENDER'
  );
  const [biografia, setBiografia] = useState(initialData?.biografia ?? '');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [cesionDerechos, setCesionDerechos] = useState(false);
  const [confirmaMayoriaEdad, setConfirmaEdad] = useState(false);
  const [fotoPerfilFile, setFoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Edad calculada en vivo ───────────────────────────────────────────────
  const edad = useMemo(() => {
    if (!fechaNacimiento) return 0;
    return calculateAge(fechaNacimiento);
  }, [fechaNacimiento]);

  const labelMayoriaEdad =
    edad > 0
      ? `Declaro que tengo ${edad} años y soy mayor de edad`
      : 'Declaro que soy mayor de edad';

  // Si la edad cambia y deja de ser mayor, desmarcar el check
  useEffect(() => {
    if (edad > 0 && edad < EDAD_MINIMA && confirmaMayoriaEdad) {
      setConfirmaEdad(false);
    }
  }, [edad, confirmaMayoriaEdad]);

  // ── Contador de biografía ────────────────────────────────────────────────
  const bioInfo = validateBiografia(biografia);
  const bioCounterColor =
    bioInfo.length > BIOGRAFIA_MAX
      ? 'text-red-500'
      : bioInfo.length > BIOGRAFIA_MAX - 30
        ? 'text-orange-500'
        : 'text-gray-500';

  // ── Estado del botón ─────────────────────────────────────────────────────
  const allChecksOk = aceptaTerminos && cesionDerechos && confirmaMayoriaEdad;
  const fechaOk = !!fechaNacimiento && esMayorDeEdad(fechaNacimiento);
  const baseOk =
    nombre.length >= 2 &&
    apellido.length >= 2 &&
    /^[VEPvep]-?\d{1,9}$/.test(cedulaIdentidad) &&
    isValidEmail(email) &&
    validateVenezuelanPhone(telefono).ok &&
    isValidInstagram(instagram) &&
    fechaOk &&
    bioInfo.ok &&
    !!fotoPerfilFile;
  const canSubmit = allChecksOk && baseOk;

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nombre,
      apellido,
      cedulaIdentidad,
      email,
      telefono,
      instagram,
      fechaNacimiento,
      categoria,
      biografia,
      aceptaTerminos: true as const,
      cesionDerechos: true as const,
      confirmaMayoriaEdad: true as const,
      fotoPerfilFile,
    };
    const parsed = formASchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]?.toString() ?? '_';
        fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-a">
      {/* Datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Nombre"
          name="nombre"
          value={nombre}
          onChange={setNombre}
          error={errors.nombre}
        />
        <Field
          label="Apellido"
          name="apellido"
          value={apellido}
          onChange={setApellido}
          error={errors.apellido}
        />
        <Field
          label="Cédula (V-12345678)"
          name="cedulaIdentidad"
          value={cedulaIdentidad}
          onChange={setCedula}
          error={errors.cedulaIdentidad}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        {/* Teléfono adaptado con Select */}
        <div>
          <label className="block text-sm font-bold mb-1">Teléfono Móvil</label>
          <div className="flex">
            <select
              value={telefono.startsWith('+') ? telefono.split(' ')[0] : '+58'}
              onChange={(e) => {
                const prefix = e.target.value;
                const rest = telefono.includes(' ') ? telefono.split(' ').slice(1).join(' ') : telefono.replace(/^\+?\d{2,3}/, '').replace(/^0/, '');
                setTelefono(`${prefix} ${rest}`);
              }}
              className="px-2 rounded-l-lg border border-r-0 border-white/10 bg-[#222] text-gray-400 font-bold focus:outline-none focus:border-brand-purple transition-colors"
            >
              <option value="+58">+58 (VE)</option>
              <option value="+1">+1 (US/CA)</option>
              <option value="+57">+57 (CO)</option>
              <option value="+34">+34 (ES)</option>
              <option value="+54">+54 (AR)</option>
              <option value="+56">+56 (CL)</option>
            </select>
            <input
              type="text"
              value={telefono.includes(' ') ? telefono.split(' ').slice(1).join(' ') : telefono}
              onChange={(e) => {
                const prefix = telefono.startsWith('+') ? telefono.split(' ')[0] : '+58';
                setTelefono(`${prefix} ${e.target.value.replace(/\D/g, '')}`);
              }}
              className="w-full bg-[#111] border border-white/10 rounded-r-lg px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
              placeholder="4125551234"
              maxLength={15}
            />
          </div>
          {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
        </div>

        <Field
          label="Instagram"
          name="instagram"
          value={instagram}
          onChange={setInstagram}
          error={errors.instagram}
          hint="Ej: @miusuario"
        />
        <div>
          <label className="block text-sm font-bold mb-1">Fecha de nacimiento</label>
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNac(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
            data-testid="input-fechaNacimiento"
            max={new Date().toISOString().split('T')[0]}
          />
          {edad > 0 && (
            <p className="text-xs text-gray-500 mt-1" data-testid="edad-display">
              Edad: {edad} años
            </p>
          )}
          {errors.fechaNacimiento && (
            <p className="text-xs text-red-500 mt-1">{errors.fechaNacimiento}</p>
          )}
        </div>
        
        {/* Categoría: Tarjetas interactivas */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-4">Selecciona la Categoría</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['RENDER', 'IA', 'AMBAS'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoria(cat)}
                className={`py-4 rounded-xl font-bold uppercase transition-all border ${
                  categoria === cat 
                    ? 'bg-brand-purple text-white border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                    : 'bg-[#111] text-gray-400 border-white/10 hover:border-white/30'
                }`}
                data-testid={`btn-categoria-${cat}`}
              >
                {cat} {cat === 'AMBAS' ? '(USD 10)' : '(USD 5)'}
              </button>
            ))}
          </div>
          {errors.categoria && <p className="text-red-500 text-xs mt-2">{errors.categoria}</p>}
        </div>
      </div>

      {/* Foto de perfil */}
      <div>
        <label className="block text-sm font-bold mb-1">
          Fotografía del participante (rostro visible)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          data-testid="input-fotoPerfil"
        />
        {errors.fotoPerfilFile && (
          <p className="text-xs text-red-500 mt-1">{errors.fotoPerfilFile}</p>
        )}
      </div>

      {/* ★ Biografía con contador ─────────────────────────────────────────── */}
      <div className="relative">
        <label className="block text-sm font-bold mb-1">
          Biografía profesional
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Describe en una breve reseña tu trayectoria, resaltando las actividades que te
          hacen un profesional o entusiasta del diseño gráfico.
        </p>
        <div className="relative">
          {/* Watermark Logo/Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-lg">
            <span className="text-white/[0.03] text-6xl font-black uppercase tracking-widest rotate-[-10deg] select-none">
              COPA 2026
            </span>
          </div>
          <textarea
            value={biografia}
            onChange={(e) => setBiografia(e.target.value.slice(0, BIOGRAFIA_MAX + 50))}
            maxLength={BIOGRAFIA_MAX + 50}
            rows={4}
            className="w-full bg-[#111]/80 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors relative z-10 bg-transparent resize-none"
            data-testid="input-biografia"
            placeholder="Soy diseñador 3D con 5 años de experiencia en..."
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-red-500">{errors.biografia ?? bioInfo.reason ?? ''}</p>
          <p
            className={`text-xs ${bioCounterColor}`}
            data-testid="biografia-counter"
          >
            {bioInfo.length} / {BIOGRAFIA_MAX}
          </p>
        </div>
      </div>

      {/* ★ Checks obligatorios ────────────────────────────────────────────── */}
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
        <Checkbox
          name="aceptaTerminos"
          checked={aceptaTerminos}
          onChange={setAceptaTerminos}
          label="Acepto los términos y condiciones del concurso"
        />
        <Checkbox
          name="cesionDerechos"
          checked={cesionDerechos}
          onChange={setCesionDerechos}
          label="Autorizo la cesión de derechos de imagen y de uso de los videos remitidos"
        />
        <Checkbox
          name="confirmaMayoriaEdad"
          checked={confirmaMayoriaEdad}
          onChange={setConfirmaEdad}
          label={labelMayoriaEdad}
          disabled={!fechaOk}
        />
      </div>

      {/* Botón Siguiente */}
      <button
        type="submit"
        disabled={!canSubmit}
        data-testid="submit-step-a"
        className={`w-full py-3 rounded-lg font-bold ${
          canSubmit
            ? 'bg-brand-purple text-white'
            : 'bg-gray-500 text-gray-300 cursor-not-allowed'
        }`}
      >
        Siguiente → Pago
      </button>
    </form>
  );
}

// ─── Subcomponentes ─────────────────────────────────────────────────────────

function Field({
  label, name, value, onChange, error, hint, type = 'text',
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white"
        data-testid={`input-${name}`}
      />
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Checkbox({
  name, checked, onChange, label, disabled,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        data-testid={`check-${name}`}
        className="w-5 h-5"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
