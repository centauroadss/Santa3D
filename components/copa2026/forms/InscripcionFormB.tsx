/**
 * InscripcionFormB — Paso 2: pago móvil.
 *
 * Cambios respecto a la versión anterior:
 *   ★ Nuevo campo `concepto` con sugerencia auto-generada (nombre + cédula).
 *   ★ Validación cliente: concepto debe contener nombre Y cédula.
 *   ★ Cálculo de monto USD esperado a partir de la categoría (5 / 10).
 *   ★ Muestra monto Bs esperado en vivo usando la tasa BCV.
 *   ★ Validación de banco/cédula/teléfono pagador y referencia.
 */

'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import {
  validateVenezuelanPhone,
  validateConcepto,
  costoUsdPorCategoria,
} from '@/lib/copa2026/validators';

// ─── Schema ─────────────────────────────────────────────────────────────────

export const formBSchema = z.object({
  bancoOrigen: z.string().min(2, 'Banco requerido'),
  cedulaPago: z
    .string()
    .regex(/^[VEPvep]?-?\d{6,9}$/, 'Cédula del pagador inválida'),
  telefonoPago: z.string().superRefine((val, ctx) => {
    const res = validateVenezuelanPhone(val);
    if (!res.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.reason || 'Teléfono pagador inválido',
      });
    }
  }),
  referencia: z
    .string()
    .min(4, 'Referencia requerida')
    .regex(/^\d+$/, 'La referencia debe ser numérica'),
  concepto: z.string().min(1, 'El concepto es obligatorio'),
  comprobanteFile: z.any().refine((f) => f instanceof File, 'Adjunte el comprobante'),
});

export type FormBData = z.infer<typeof formBSchema>;

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  initialData?: Partial<FormBData>;
  onBack: () => void;
  onSubmit: (data: FormBData) => void;
  isLoading: boolean;
  tasaBcv: number;
  categoria: 'RENDER' | 'IA' | 'AMBAS';
  costoUnaCategoria: number;   // viene del admin (default 5)
  costoAmbasCategorias: number; // viene del admin (default 10)
  configPago: { banco: string; cedula: string; telefono: string };
  // ★ Datos del participante para validar el concepto:
  participante: { nombre: string; apellido: string; cedulaIdentidad: string };
}

// ─── Componente ─────────────────────────────────────────────────────────────

export default function InscripcionFormB(props: Props) {
  const {
    initialData, onBack, onSubmit, isLoading, tasaBcv,
    categoria, costoUnaCategoria, costoAmbasCategorias,
    configPago, participante,
  } = props;

  // Cálculo del monto en USD y Bs
  const MONTO_USD =
    categoria === 'AMBAS' ? costoAmbasCategorias : costoUnaCategoria;
  const MONTO_BS = useMemo(() => (tasaBcv * MONTO_USD).toFixed(2), [tasaBcv, MONTO_USD]);

  // Concepto sugerido (autocompletable)
  const conceptoSugerido = `${participante.nombre} ${participante.apellido} ${participante.cedulaIdentidad}`;

  // ── Estado ───────────────────────────────────────────────────────────────
  const [bancoOrigen, setBanco] = useState(initialData?.bancoOrigen ?? '');
  const [cedulaPago, setCedulaPago] = useState(initialData?.cedulaPago ?? '');
  const [telefonoPago, setTelPago] = useState(initialData?.telefonoPago ?? '');
  const [referencia, setReferencia] = useState(initialData?.referencia ?? '');
  const [concepto, setConcepto] = useState(initialData?.concepto ?? conceptoSugerido);
  const [comprobanteFile, setComprobante] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('copa2026_formDataB');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.bancoOrigen) setBanco(parsed.bancoOrigen);
          if (parsed.cedulaPago) setCedulaPago(parsed.cedulaPago);
          if (parsed.telefonoPago) setTelPago(parsed.telefonoPago);
          if (parsed.referencia) setReferencia(parsed.referencia);
          if (parsed.concepto) setConcepto(parsed.concepto);
        } catch (e) {}
      }
    }
  }, []);

  // Save to sessionStorage when values change
  useEffect(() => {
    const dataToSave = { bancoOrigen, cedulaPago, telefonoPago, referencia, concepto };
    sessionStorage.setItem('copa2026_formDataB', JSON.stringify(dataToSave));
  }, [bancoOrigen, cedulaPago, telefonoPago, referencia, concepto]);

  // ── Dropzone ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setComprobante(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      if (errors.comprobanteFile) {
        setErrors(prev => ({ ...prev, comprobanteFile: '' }));
      }
    }
  }, [errors.comprobanteFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // ── Validación del concepto en vivo ─────────────────────────────────────
  const conceptoCheck = validateConcepto(
    concepto,
    `${participante.nombre} ${participante.apellido}`,
    participante.cedulaIdentidad
  );

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      bancoOrigen,
      cedulaPago,
      telefonoPago,
      referencia,
      concepto,
      comprobanteFile,
    };
    const parsed = formBSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]?.toString() ?? '_';
        fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (!conceptoCheck.ok) {
      setErrors({ concepto: conceptoCheck.reason! });
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  };

  const BANCOS = [
    { codigo: '0102', nombre: 'Banco de Venezuela' },
    { codigo: '0104', nombre: 'Banco Venezolano de Crédito' },
    { codigo: '0105', nombre: 'Mercantil' },
    { codigo: '0108', nombre: 'Provincial' },
    { codigo: '0114', nombre: 'Bancaribe' },
    { codigo: '0115', nombre: 'Exterior' },
    { codigo: '0128', nombre: 'Banco Caroní' },
    { codigo: '0134', nombre: 'Banesco' },
    { codigo: '0137', nombre: 'Sofitasa' },
    { codigo: '0138', nombre: 'Banco Plaza' },
    { codigo: '0151', nombre: 'BFC Banco Fondo Común' },
    { codigo: '0156', nombre: '100% Banco' },
    { codigo: '0157', nombre: 'Del Sur' },
    { codigo: '0163', nombre: 'Tesoro' },
    { codigo: '0166', nombre: 'Agrícola de Venezuela' },
    { codigo: '0168', nombre: 'Bancrecer' },
    { codigo: '0169', nombre: 'Mi Banco' },
    { codigo: '0171', nombre: 'Banco Activo' },
    { codigo: '0172', nombre: 'Bancamiga' },
    { codigo: '0174', nombre: 'Banplus' },
    { codigo: '0175', nombre: 'Bicentenario' },
    { codigo: '0177', nombre: 'Banfanb' },
    { codigo: '0191', nombre: 'BNC Nacional de Crédito' }
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left" data-testid="form-b">
      {/* INSTRUCCIONES DE PAGO */}
      <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-2xl p-6 text-center">
        <h3 className="text-sm text-brand-purple font-bold uppercase tracking-widest mb-4">Monto a Pagar Hoy</h3>
        <div className="text-5xl font-black text-white mb-2">{MONTO_BS} Bs.</div>
        <p className="text-sm text-gray-400 font-mono">USD {MONTO_USD.toFixed(2)} x T/C BCV {tasaBcv.toFixed(4)} Bs/USD</p>

        <div className="mt-6 pt-6 border-t border-brand-purple/20 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Banco</p>
            <p className="text-white font-medium">{configPago.banco}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Teléfono</p>
            <p className="text-white font-medium">{configPago.telefono}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Cédula / RIF</p>
            <p className="text-white font-medium">{configPago.cedula}</p>
          </div>
        </div>
      </div>

      {/* Datos del pagador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-1">Banco del pagador</label>
          <select
            value={bancoOrigen}
            onChange={(e) => setBanco(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white"
            data-testid="input-bancoOrigen"
          >
            <option value="">Selecciona tu banco...</option>
            {BANCOS.map(b => (
              <option key={b.codigo} value={b.codigo}>{b.codigo} - {b.nombre}</option>
            ))}
          </select>
          {errors.bancoOrigen && <p className="text-xs text-red-500 mt-1">{errors.bancoOrigen}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Cédula del pagador</label>
          <div className="flex">
            <select
              value={cedulaPago.match(/^[a-zA-Z]/) ? cedulaPago.charAt(0).toUpperCase() : 'V'}
              onChange={(e) => {
                const prefix = e.target.value;
                const number = cedulaPago.replace(/^[a-zA-Z]-?/, '');
                setCedulaPago(number ? `${prefix}-${number}` : prefix);
              }}
              className="px-2 rounded-l-lg border border-r-0 border-white/10 bg-[#222] text-gray-400 font-bold focus:outline-none focus:border-brand-purple transition-colors"
            >
              <option value="V">V-</option>
              <option value="E">E-</option>
              <option value="P">P-</option>
              <option value="J">J-</option>
              <option value="G">G-</option>
            </select>
            <input
              type="text"
              value={cedulaPago.replace(/^[a-zA-Z]-?/, '')}
              onChange={(e) => {
                const prefix = cedulaPago.match(/^[a-zA-Z]/) ? cedulaPago.charAt(0).toUpperCase() : 'V';
                const val = e.target.value.replace(/\D/g, '');
                setCedulaPago(`${prefix}-${val}`);
              }}
              className="w-full bg-[#111] border border-white/10 rounded-r-lg px-4 py-3 text-white uppercase focus:border-brand-purple outline-none transition-colors"
              placeholder="12345678"
              maxLength={9}
              data-testid="input-cedulaPago"
            />
          </div>
          {errors.cedulaPago && <p className="text-xs text-red-500 mt-1">{errors.cedulaPago}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Teléfono del pagador</label>
          <div className="flex">
            <select
              value={telefonoPago.startsWith('+') ? telefonoPago.split(' ')[0] : '+58'}
              onChange={(e) => {
                const prefix = e.target.value;
                const rest = telefonoPago.includes(' ') ? telefonoPago.split(' ').slice(1).join(' ') : telefonoPago.replace(/^\+?\d{2,3}/, '').replace(/^0/, '');
                setTelPago(`${prefix} ${rest}`);
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
              value={telefonoPago.includes(' ') ? telefonoPago.split(' ').slice(1).join(' ') : telefonoPago}
              onChange={(e) => {
                const prefix = telefonoPago.startsWith('+') ? telefonoPago.split(' ')[0] : '+58';
                setTelPago(`${prefix} ${e.target.value.replace(/\D/g, '')}`);
              }}
              className="w-full bg-[#111] border border-white/10 rounded-r-lg px-4 py-3 text-white focus:border-brand-purple outline-none transition-colors"
              placeholder="4125551234"
              maxLength={15}
            />
          </div>
          {errors.telefonoPago && <p className="text-xs text-red-500 mt-1">{errors.telefonoPago}</p>}
        </div>
        <Field
          label="Número de referencia"
          name="referencia"
          value={referencia}
          onChange={setReferencia}
          error={errors.referencia}
        />
      </div>

      {/* ★ Concepto ─────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold mb-1">Concepto del pago</label>
        <p className="text-xs text-gray-500 mb-2">
          Debe incluir tu <strong>nombre y número de cédula</strong> tal como los
          cargaste en el paso anterior. Sugerencia:&nbsp;
          <code className="bg-white/10 px-1 rounded">{conceptoSugerido}</code>
        </p>
        <input
          type="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white"
          data-testid="input-concepto"
        />
        <div className="text-xs mt-1">
          {!conceptoCheck.ok && concepto.length > 0 && (
            <span className="text-red-500" data-testid="concepto-error">
              {conceptoCheck.reason}
            </span>
          )}
          {conceptoCheck.ok && (
            <span className="text-green-500" data-testid="concepto-ok">
              ✓ Concepto válido
            </span>
          )}
        </div>
        {errors.concepto && (
          <p className="text-xs text-red-500 mt-1">{errors.concepto}</p>
        )}
      </div>

      {/* Comprobante */}
      <div>
        <label className="block text-sm font-bold mb-2">
          Comprobante de pago (imagen o PDF)
        </label>
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-brand-purple bg-brand-purple/10' : 'border-white/20 bg-[#111] hover:border-white/40'
          }`}
          data-testid="dropzone-comprobante"
        >
          <input {...getInputProps()} data-testid="input-comprobante" />
          {preview ? (
            <div className="space-y-4">
              {comprobanteFile?.type === 'application/pdf' ? (
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">📄</span>
                </div>
              ) : (
                <img src={preview} alt="Preview" className="mx-auto h-32 object-contain rounded" />
              )}
              <p className="text-sm text-brand-purple">Clic o arrastra para cambiar el archivo</p>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="mx-auto w-12 h-12 bg-[#222] rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📸</span>
              </div>
              <p className="text-white font-medium">Sube el comprobante o arrástralo aquí</p>
              <p className="text-gray-500 text-sm">Formatos soportados: JPG, PNG, WEBP, PDF (Max 5MB)</p>
            </div>
          )}
        </div>
        {errors.comprobanteFile && (
          <p className="text-xs text-red-500 mt-1">{errors.comprobanteFile}</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg bg-gray-700 text-white font-bold"
          data-testid="btn-back"
        >
          ← Volver
        </button>
        <button
          type="submit"
          disabled={isLoading || !conceptoCheck.ok}
          data-testid="submit-step-b"
          className={`flex-1 py-3 rounded-lg font-bold ${
            isLoading || !conceptoCheck.ok
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-brand-purple text-white'
          }`}
        >
          {isLoading ? 'Enviando…' : 'Confirmar inscripción'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label, name, value, onChange, error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white"
        data-testid={`input-${name}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
