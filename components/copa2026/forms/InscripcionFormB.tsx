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
  telefonoPago: z
    .string()
    .refine((v) => validateVenezuelanPhone(v).ok, 'Teléfono pagador inválido'),
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-b">
      {/* Datos del receptor (fijos) */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
        <h3 className="font-bold mb-2">Datos para pago móvil:</h3>
        <p>Banco: <strong>{configPago.banco}</strong></p>
        <p>Cédula: <strong>{configPago.cedula}</strong></p>
        <p>Teléfono: <strong>{configPago.telefono}</strong></p>
        <p className="mt-2 text-lg">
          Monto a pagar:&nbsp;
          <strong data-testid="monto-usd">USD {MONTO_USD.toFixed(2)}</strong>
          &nbsp;=&nbsp;
          <strong data-testid="monto-bs">Bs {MONTO_BS}</strong>
          &nbsp;<span className="text-xs text-gray-500">(tasa BCV {tasaBcv})</span>
        </p>
      </div>

      {/* Datos del pagador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Banco del pagador"
          name="bancoOrigen"
          value={bancoOrigen}
          onChange={setBanco}
          error={errors.bancoOrigen}
        />
        <Field
          label="Cédula del pagador"
          name="cedulaPago"
          value={cedulaPago}
          onChange={setCedulaPago}
          error={errors.cedulaPago}
        />
        <Field
          label="Teléfono del pagador"
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
