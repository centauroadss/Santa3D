/**
 * /admin/inscripciones
 *
 * Listado paginado con filtros (q, categoria, estatus, fecha).
 * Cada fila linkea a /admin/inscripciones/[id] para el detalle.
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface ItemRow {
  id: number;
  nombre: string;
  apellido: string;
  cedulaIdentidad: string;
  email: string;
  telefono: string;
  categoria: 'RENDER' | 'IA' | 'AMBAS';
  estatusInscripcion: string;
  createdAt: string;
  edadAlInscribir: number | null;
  videosCount: number;
}

export default function ListadoInscripciones() {
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estatus, setEstatus] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q,
      categoria,
      estatus,
      page: String(page),
      pageSize: '20',
    });
    const res = await fetch(`/api/admin/inscripciones?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoria, estatus]);

  return (
    <div className="p-6 text-gray-900" data-testid="inscripciones-list">
      <h1 className="text-3xl font-black mb-6">Inscripciones</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          placeholder="Buscar nombre, cédula, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (setPage(1), cargar())}
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
          data-testid="input-q"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="border rounded px-3 py-2"
          data-testid="select-categoria"
        >
          <option value="">Todas las categorías</option>
          <option value="RENDER">Render</option>
          <option value="IA">IA</option>
          <option value="AMBAS">Ambas</option>
        </select>
        <select
          value={estatus}
          onChange={(e) => setEstatus(e.target.value)}
          className="border rounded px-3 py-2"
          data-testid="select-estatus"
        >
          <option value="">Todos los estatus</option>
          <option value="APROBADO">Aprobado</option>
          <option value="COMPLETADO">Completado</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Fecha</th>
              <th className="p-2">Participante</th>
              <th className="p-2">Cédula</th>
              <th className="p-2">Email</th>
              <th className="p-2">Categoría</th>
              <th className="p-2">Edad</th>
              <th className="p-2">Estatus</th>
              <th className="p-2">Videos</th>
              <th className="p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b" data-testid={`row-${it.id}`}>
                <td className="p-2">
                  {new Date(it.createdAt).toLocaleString('es-VE', {
                    timeZone: 'America/Caracas',
                  })}
                </td>
                <td className="p-2">
                  {it.nombre} {it.apellido}
                </td>
                <td className="p-2">{it.cedulaIdentidad}</td>
                <td className="p-2">{it.email}</td>
                <td className="p-2">{it.categoria}</td>
                <td className="p-2">{it.edadAlInscribir ?? '—'}</td>
                <td className="p-2">{it.estatusInscripcion}</td>
                <td className="p-2">{it.videosCount}</td>
                <td className="p-2">
                  <Link
                    href={`/admin/inscripciones/${it.id}`}
                    className="text-brand-purple underline"
                    data-testid={`link-detalle-${it.id}`}
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  No hay inscripciones que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded"
        >
          ←
        </button>
        <span>
          Página {page} — {total} resultado(s)
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * 20 >= total}
          className="px-3 py-1 border rounded"
        >
          →
        </button>
      </div>
    </div>
  );
}
