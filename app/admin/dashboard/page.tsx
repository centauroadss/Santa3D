// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import StatsCard from '@/components/admin/StatsCard';
import RankingsTable from '@/components/admin/RankingsTable';
import Button from '@/components/ui/Button';
import Countdown from '@/components/ui/Countdown';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedName = localStorage.getItem('admin_name');

    if (!storedToken) {
      router.push('/admin/login');
      return;
    }

    setToken(storedToken);
    setAdminName(storedName || 'Admin');

    fetchStats(storedToken);
    fetchRankings(storedToken);
  }, []);

  const fetchStats = async (authToken: string) => {
    try {
      const response = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchRankings = async (authToken: string) => {
    try {
      const response = await axios.get('/api/admin/rankings?minEvaluations=3&limit=50', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.data.success) {
        setRankings(response.data.data.rankings);
      }
    } catch (err) {
      console.error('Error fetching rankings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleInstagramSync = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const response = await axios.post('/api/admin/instagram/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`✅ Sincronización Exitosa:\n${response.data.message}`);
        // Refresh other data
        fetchStats(token);
        fetchRankings(token);
      } else {
        alert('⚠️ Error en sincronización: ' + response.data.error);
      }
    } catch (err: any) {
      console.error('Sync Error:', err);
      alert('❌ Error de conexión con el servidor.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async () => {
    // ... existing export logic ...
    if (!token) return;

    try {
      const response = await axios.get('/api/admin/export?format=csv&include=rankings', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `santa3d-rankings-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  // ... existing logout ...
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    router.push('/admin/login');
  };

  if (isLoading) {
    // ... loaidng ...
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
              <p className="text-white/80">Bienvenido, {adminName}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="bg-white/20 border-white text-white hover:bg-white/30">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Countdown */}
        {stats?.timeline && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">⏰ Tiempo Restante para Envío</h2>
            <Countdown deadline={stats.timeline.submissionDeadline} />
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Participantes"
              value={stats.participants.total}
              subtitle={`${stats.participants.withVideo} con video`}
              icon="👥"
              color="purple"
            />
            <StatsCard
              title="Videos Validados"
              value={stats.videos.validated}
              subtitle={`${stats.videos.rejected} rechazados`}
              icon="✅"
              color="green"
            />
            <StatsCard
              title="Evaluaciones"
              value={`${stats.evaluations.percentageComplete}%`}
              subtitle={`${stats.evaluations.completed} / ${stats.evaluations.totalPossible}`}
              icon="📊"
              color="blue"
            />
            <StatsCard
              title="Votos Instagram"
              value={isSyncing ? '...' : (stats.videos?.totalLikes || '-')}
              subtitle="Likes sincronizados"
              icon="❤️"
              color="red"
            />
          </div>
        )}

        {/* Instagram Actions */}
        <div className="mb-8 p-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">📸 Robot de Instagram</h3>
            <p className="opacity-90">Sincroniza los votos (likes) de los posts etiquetados con la base de datos.</p>
          </div>
          <Button
            onClick={handleInstagramSync}
            disabled={isSyncing}
            className="bg-white text-purple-900 font-bold px-8 py-4 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
          >
            {isSyncing ? '🔄 Sincronizando...' : '⚡ EJECUTAR SYNC AHORA'}
          </Button>
        </div>

        {/* Rankings Table */}
        <RankingsTable rankings={rankings} onExport={handleExport} />

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            🔄 Actualizar Datos
          </Button>
          <Button onClick={handleExport} variant="outline" className="w-full">
            📥 Exportar CSV
          </Button>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full">
            🏠 Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
