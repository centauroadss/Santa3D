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

import React, { useMemo, useState } from 'react';
import { z } from 'zod';
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          <div className="text-white font-medium">${MONTO_USD.toFixed(2)} USD</div>
          <div className="text-neutral-400">Tasa BCV del Día:</div>
          <div className="text-white font-medium">Bs. {tasaBcv.toFixed(4)}</div>
          <div className="text-neutral-400 font-bold text-lg mt-1">Monto Exacto a Pagar:</div>
          <div className="text-red-500 font-bold text-xl mt-1">Bs. {MONTO_BS}</div>
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
        <Field
          label="Cédula del pagador"
          name="cedulaPago"
          value={cedulaPago}
          onChange={setCedulaPago}
          error={errors.cedulaPago}
        />
        <Field
          label="Teléfono del pagador (10 dígitos)"
          name="telefonoPago"
          value={telefonoPago}
          onChange={setTelPago}
          error={errors.telefonoPago}
        />
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
        <label className="block text-sm font-bold mb-1">
          Comprobante de pago (imagen o PDF)
        </label>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
          data-testid="input-comprobante"
        />
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
