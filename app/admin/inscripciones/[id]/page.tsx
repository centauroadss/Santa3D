/**
 * /admin/inscripciones/[id]
 *
 * Vista de detalle de UNA inscripción. Muestra:
 *   - Fecha y hora de inscripción
 *   - Fotografía del participante
 *   - Todos los datos personales
 *   - Comprobante de pago (clickeable → modal full screen)
 *   - Datos del pago: banco, referencia, monto, concepto + ✓ si validado
 *   - Categoría(s)
 *   - Lista de videos cargados — click en cada uno abre reproductor inline
 */

'use client';

import React, { useEffect, useState } from 'react';

interface Detalle {
  id: number;
  createdAt: string;
  participante: {
    nombre: string;
    apellido: string;
    cedulaIdentidad: string;
    email: string;
    telefono: string;
    instagram: string;
    fechaNacimiento: string;
    edadAlInscribir: number;
    biografia: string;
    fotoPerfilUrl: string;
    categoria: 'RENDER' | 'IA' | 'AMBAS';
    confirmaMayoriaEdad: boolean;
    aceptaTerminos: boolean;
    cesionDerechos: boolean;
  };
  pago: {
    banco: string;
    cedulaPago: string;
    telefonoPago: string;
    referencia: string;
    concepto: string;
    conceptoValidado: boolean;
    montoBs: string | null;
    comprobanteUrl: string;
  } | null;
  videos: Array<{
    id: number;
    rutaS3: string;
    nombreArchivo: string;
    duracionSeg: number;
    resolucion: string;
    fps: number;
    formato: string;
    estatus: string;
  }>;
  estado: {
    estatusInscripcion: string;
    estatusToken: string;
    tokenVideo: string;
  };
}

export default function DetalleInscripcion({
  params,
}: {
  params: { id: string };
}) {
  const [d, setD] = useState<Detalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomComprobante, setZoom] = useState(false);
  const [videoExpandido, setVideoExpandido] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/inscripciones/${params.id}`);
      if (res.ok) setD(await res.json());
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <p className="p-6">Cargando…</p>;
  if (!d) return <p className="p-6">No encontrada.</p>;

  const fechaFmt = new Date(d.createdAt).toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return (
    <div className="p-6 max-w-6xl mx-auto text-gray-900" data-testid="detalle">
      <header className="mb-6">
        <h1 className="text-3xl font-black">
          Inscripción #{d.id} — {d.participante.nombre} {d.participante.apellido}
        </h1>
        <p className="text-gray-600" data-testid="fecha-inscripcion">
          Inscrito el {fechaFmt}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Columna 1: Foto + datos personales ── */}
        <section className="lg:col-span-1 space-y-4">
          <img
            src={d.participante.fotoPerfilUrl}
            alt="Foto del participante"
            className="w-full rounded-lg shadow"
            data-testid="foto-participante"
          />
          <DataBlock title="Datos personales">
            <Row k="Cédula" v={d.participante.cedulaIdentidad} />
            <Row k="Email" v={d.participante.email} />
            <Row k="Teléfono" v={d.participante.telefono} />
            <Row k="Instagram" v={d.participante.instagram} />
            <Row k="Fecha de nacimiento" v={d.participante.fechaNacimiento.slice(0, 10)} />
            <Row k="Edad al inscribirse" v={String(d.participante.edadAlInscribir)} />
            <Row k="Categoría" v={d.participante.categoria} />
          </DataBlock>
          <DataBlock title="Consentimientos">
            <Row k="Mayoría de edad" v={d.participante.confirmaMayoriaEdad ? '✓' : '✗'} />
            <Row k="Términos" v={d.participante.aceptaTerminos ? '✓' : '✗'} />
            <Row k="Cesión derechos" v={d.participante.cesionDerechos ? '✓' : '✗'} />
          </DataBlock>
        </section>

        {/* ── Columna 2: Biografía + Pago ── */}
        <section className="lg:col-span-1 space-y-4">
          <DataBlock title="Biografía profesional">
            <p
              className="whitespace-pre-wrap text-sm"
              data-testid="biografia"
            >
              {d.participante.biografia}
            </p>
          </DataBlock>

          {d.pago && (
            <DataBlock title="Datos del pago">
              <Row k="Banco" v={d.pago.banco} />
              <Row k="Cédula pagador" v={d.pago.cedulaPago} />
              <Row k="Teléfono pagador" v={d.pago.telefonoPago} />
              <Row k="Referencia" v={d.pago.referencia} />
              <Row k="Monto detectado" v={`Bs ${d.pago.montoBs ?? '—'}`} />
              <div className="mt-2">
                <p className="text-xs font-bold uppercase text-gray-500">Concepto</p>
                <p className="text-sm" data-testid="concepto-texto">
                  {d.pago.concepto}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    d.pago.conceptoValidado ? 'text-green-600' : 'text-red-600'
                  }`}
                  data-testid="concepto-validado"
                >
                  {d.pago.conceptoValidado
                    ? '✓ Contiene nombre y cédula del participante'
                    : '✗ NO contiene nombre y/o cédula'}
                </p>
              </div>
            </DataBlock>
          )}
        </section>

        {/* ── Columna 3: Comprobante + Videos ── */}
        <section className="lg:col-span-1 space-y-4">
          {d.pago && (
            <DataBlock title="Comprobante de pago">
              <img
                src={d.pago.comprobanteUrl}
                alt="Comprobante"
                onClick={() => setZoom(true)}
                className="w-full rounded shadow cursor-zoom-in"
                data-testid="img-comprobante"
              />
            </DataBlock>
          )}

          <DataBlock title={`Videos cargados (${d.videos.length})`}>
            {d.videos.length === 0 && (
              <p className="text-sm text-gray-500">Aún no hay videos.</p>
            )}
            {d.videos.map((v) => (
              <div
                key={v.id}
                className="border-t pt-2 mt-2"
                data-testid={`video-${v.id}`}
              >
                <button
                  onClick={() =>
                    setVideoExpandido(videoExpandido === v.id ? null : v.id)
                  }
                  className="text-left w-full font-bold underline text-brand-purple"
                  data-testid={`btn-video-${v.id}`}
                >
                  {v.nombreArchivo}
                </button>
                <p className="text-xs text-gray-500">
                  {v.resolucion} · {v.fps}fps · {v.duracionSeg}s · {v.formato} ·{' '}
                  {v.estatus}
                </p>
                {videoExpandido === v.id && (
                  <video
                    src={v.rutaS3}
                    controls
                    className="w-full mt-2 rounded"
                    data-testid={`player-${v.id}`}
                  />
                )}
              </div>
            ))}
          </DataBlock>
        </section>
      </div>

      {/* Modal zoom comprobante */}
      {zoomComprobante && d.pago && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out"
          onClick={() => setZoom(false)}
          data-testid="modal-comprobante"
        >
          <img
            src={d.pago.comprobanteUrl}
            alt="Comprobante full"
            className="max-w-[90vw] max-h-[90vh]"
          />
        </div>
      )}
    </div>
  );
}

function DataBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <h2 className="font-bold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b last:border-b-0">
      <span className="text-gray-500">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
