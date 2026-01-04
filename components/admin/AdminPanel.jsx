import React, { useState, useEffect } from 'react';
import { 
  Database, 
  PlusCircle, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Package,
  LayoutDashboard
} from 'lucide-react';

// Mock de datos para simular la estructura que tendrías con Prisma
const initialMockData = [
  { id: 1, name: "Figura Santa Claus 20cm", category: "Decoración", stock: 15, price: 25.99 },
  { id: 2, name: "Reno Articulado", category: "Juguetes", stock: 8, price: 18.50 },
];

export default function App() {
  const [items, setItems] = useState(initialMockData);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: 'success', message: 'Conectado a MySQL (vía Prisma)' });
  const [newItem, setNewItem] = useState({ name: '', category: '', stock: '', price: '' });

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    
    setLoading(true);
    // Simulación de escritura en DB
    setTimeout(() => {
      const item = {
        ...newItem,
        id: Date.now(),
        stock: parseInt(newItem.stock) || 0,
        price: parseFloat(newItem.price) || 0
      };
      setItems([item, ...items]);
      setNewItem({ name: '', category: '', stock: '', price: '' });
      setLoading(false);
      setStatus({ type: 'success', message: 'Producto guardado en la base de datos' });
    }, 800);
  };

  const deleteItem = (id) => {
    setItems(items.filter(i => i.id !== id));
    setStatus({ type: 'info', message: 'Registro eliminado' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Santa3D <span className="text-slate-400 font-normal">| Admin</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            status.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
          }`}>
            <Database className="w-3 h-3" />
            MySQL: localhost:3306
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario de Inserción */}
        <section className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Nuevo Producto
            </h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ej: Trineo Madera"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ej: Navidad"
                  value={newItem.category}
                  onChange={e => setNewItem({...newItem, category: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newItem.stock}
                    onChange={e => setNewItem({...newItem, stock: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio ($)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: e.target.value})}
                  />
                </div>
              </div>
              <button 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                Registrar en DB
              </button>
            </form>

            {status.message && (
              <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
              }`}>
                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                {status.message}
              </div>
            )}
          </div>
        </section>

        {/* Tabla de Datos */}
        <section className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Registros en `santa3d_db`
              </h2>
              <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-slate-600 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3 text-right">Stock</th>
                    <th className="px-6 py-3 text-right">Precio</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                      <td className="px-6 py-4 text-slate-400 font-mono">#{item.id.toString().slice(-4)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-medium">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">{item.stock}</td>
                      <td className="px-6 py-4 text-right font-semibold">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                No hay registros en la base de datos.
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}