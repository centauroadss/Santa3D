'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import VideoCard from '@/components/judges/VideoCard';
import EvaluationForm from '@/components/judges/EvaluationForm';
import EvaluatedVideosTable from '@/components/judges/EvaluatedVideosTable';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TechnicalReportTable from '@/components/judges/TechnicalReportTable'; // New Import

export default function JudgePanelPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [judgeName, setJudgeName] = useState<string>('');
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  useEffect(() => {
    const storedToken = localStorage.getItem('judge_token');
    const storedName = localStorage.getItem('judge_name');

    if (!storedToken) {
      router.push('/jueces/login');
      return;
    }

    setToken(storedToken);
    setJudgeName(storedName || 'Juez');

    fetchVideos(storedToken);
    fetchProgress(storedToken);
  }, [filter]);

  const fetchVideos = async (authToken: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/judges/videos', {
        params: {
          evaluated: filter === 'pending' ? 'false' : undefined,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        setVideos(response.data.data.videos);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async (authToken: string) => {
    try {
      const response = await axios.get('/api/judges/my-progress', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        setProgress(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('judge_token');
    localStorage.removeItem('judge_name');
    router.push('/jueces/login');
  };

  const handleEvaluationSuccess = () => {
    setSelectedVideoId(null);
    if (token) {
      fetchVideos(token);
      fetchProgress(token);
    }
  };

  const getSelectedVideo = () => {
    return videos.find(v => v.id === selectedVideoId);
  };

  const selectedVideoInfo = getSelectedVideo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-purple to-brand-orange text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Panel de Evaluación</h1>
              <p className="text-white/80">Bienvenido, {judgeName}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="bg-white/20 border-white text-white hover:bg-white/30">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Card (Solo visible en vistas de video) */}
        {progress && (
          <Card className="mb-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-purple">{progress.totalVideos}</div>
                <div className="text-sm text-gray-600 mt-1">Total Videos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{progress.videosEvaluated}</div>
                <div className="text-sm text-gray-600 mt-1">Evaluados</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{progress.videosPending}</div>
                <div className="text-sm text-gray-600 mt-1">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{progress.percentageComplete}%</div>
                <div className="text-sm text-gray-600 mt-1">Completado</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-brand-purple to-brand-orange h-3 rounded-full transition-all"
                  style={{ width: `${progress.percentageComplete}%` }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Filters / Tabs */}
        <div className="flex md:flex-row flex-col gap-4 mb-6">
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'primary' : 'outline'}
          >
            📝 Pendientes
          </Button>
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'outline'}
          >
            📋 Todos
          </Button>
        </div>

        {/* Dynamic Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {filter === 'pending' ? '¡Excelente trabajo!' : 'No hay videos disponibles'}
              </h3>
              <p className="text-gray-600">
                {filter === 'pending'
                  ? 'No hay videos pendientes por evaluar'
                  : 'No se encontraron videos registrados'}
              </p>
            </div>
          </Card>
        ) : filter === 'all' ? (
          /* TABLA DE EVALUADOS */
          <EvaluatedVideosTable
            videos={videos}
            onEdit={(video) => setSelectedVideoId(video.id)}
          />
        ) : (
          /* GRID DE PENDIENTES */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onEvaluate={setSelectedVideoId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Evaluation Modal - Custom Layout */}
      {selectedVideoId && token && selectedVideoInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl h-auto md:h-[90vh]">
            {/* Visual Section - Video */}
            <div className="flex-1 flex items-center justify-center">
              <div
                style={{
                  height: '80vh',
                  width: 'calc(80vh * (9/16))', // Constrain by height
                  maxWidth: '100%',
                  aspectRatio: '9 / 16'
                }}
              >
                <video
                  src={selectedVideoInfo.streamUrl}
                  controls
                  controlsList="nodownload" // Protection
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()} // Protection
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Tu navegador no soporta el tag de video.
                </video>
                <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                  <div className="font-bold text-white text-2xl">{selectedVideoInfo.participant.instagram}</div>
                  <div className="text-gray-300">{selectedVideoInfo.participant.alias}</div>
                </div>

                {/* Technical Report Below Video */}
                <div className="mt-4 px-4 pb-4">
                  <TechnicalReportTable
                    resolution={selectedVideoInfo.resolution}
                    duration={selectedVideoInfo.duration}
                    fps={selectedVideoInfo.fps}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Interaction Section - Form */}
            <div className="flex-1 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:max-w-xl">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedVideoInfo.evaluation ? 'Editar Evaluación' : 'Evaluación del Video'}
                </h3>
                <button
                  onClick={() => setSelectedVideoId(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <EvaluationForm
                  videoId={selectedVideoId}
                  token={token}
                  onSuccess={handleEvaluationSuccess}
                  onCancel={() => setSelectedVideoId(null)}
                  initialData={selectedVideoInfo.evaluation}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
