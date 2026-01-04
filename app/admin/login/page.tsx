'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/admin/login', { email, password });
      if (res.data.success) {
        // Store token in localStorage for client-side usage if needed
        localStorage.setItem('admin_token', res.data.token);
        router.push(res.data.redirect);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-brand-purple w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Acceso Administrativo</h1>
          <p className="text-gray-500 text-sm mt-2">Ingresa tus credenciales autorizadas</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Correo Institucional</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@dominio.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Contraseña Segura</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Volver al sitio público
          </a>
        </div>
      </div>
    </div>
  );
}
