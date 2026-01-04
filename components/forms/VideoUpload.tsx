'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { formatFileSize } from '@/lib/utils';
/*
  CRITICAL: SOFT VALIDATION ONLY.
  Do NOT block uploads based on technical specs (resolution, duration, fps).
  Only display visual warnings. Upload must be allowed if file size is valid.
*/
interface VideoUploadProps {
  participantId: string;
  participantData: any;
  onSuccess: () => void;
}
interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps?: number; // Opcional porque es difícil en navegador
}
export default function VideoUpload({ participantId, participantData, onSuccess }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const generateIdentifier = (originalFile: File) => {
    if (!participantData) return originalFile.name;
    const clean = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '');
    const ig = clean((participantData.instagram || '').replace('@', ''));
    const name = clean(participantData.nombre || 'Participante');
    const surname = clean(participantData.apellido || '');
    const ext = originalFile.name.substring(originalFile.name.lastIndexOf('.'));
    const baseName = clean(originalFile.name.replace(ext, '').substring(0, 15));
    return `${ig}_${name}_${surname}_${baseName}${ext}`;
  };
  const extractMetadata = (file: File): Promise<VideoMetadata> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          fps: 30 // Valor por defecto/asumido en cliente
        });
      };
      video.onerror = () => {
        resolve({ width: 0, height: 0, duration: 0, fps: 0 });
      };
      video.src = URL.createObjectURL(file);
    });
  };
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      // Validar tamaño (única validación bloqueante física de la nube/red)
      if (selectedFile.size > 524288000) {
        setError('El archivo no puede superar 500MB');
        return;
      }
      // Extraer metadata (sin bloquear)
      const meta = await extractMetadata(selectedFile);
      setMetadata(meta);
      setFile(selectedFile);
      setError(null);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    multiple: false,
    maxSize: 524288000,
  });
  const handleUpload = async () => {
    if (!file) return;
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      setStatusMessage('Preparando subida...');
      const identifier = generateIdentifier(file);
      // 1. Obtener URL
      const presignedResponse = await axios.post('/api/videos/presigned-url', {
        fileName: identifier,
        fileType: file.type,
        fileSize: file.size
      }, {
        headers: { 'x-participant-id': participantId }
      });
      if (!presignedResponse.data.success) throw new Error(presignedResponse.data.message);
      const { uploadUrl, videoId } = presignedResponse.data.data;
      // 2. Subir a S3
      setStatusMessage('Subiendo video a la nube...');
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
        onUploadProgress: (ev) => setUploadProgress(ev.total ? Math.round((ev.loaded * 100) / ev.total) : 0),
      });
      // 3. Confirmar en Backend (Enviando metadata real)
      setStatusMessage('Verificando archivo...');
      const confirmResponse = await axios.post('/api/videos/confirm', {
        videoId: videoId,
        fileName: identifier,
        // Metadata extraída
        duration: metadata?.duration || 0,
        resolution: metadata ? `${metadata.width}x${metadata.height}` : '0x0',
        width: metadata?.width || 0,
        height: metadata?.height || 0,
        fps: metadata?.fps || 30
      }, {
        headers: { 'x-participant-id': participantId }
      });
      if (!confirmResponse.data.success) throw new Error(confirmResponse.data.message);
      onSuccess();
    } catch (err: any) {
      console.error('Upload Error:', err);
      const msg = err.response?.data?.error || err.message || 'Error desconocido';
      setError(`Error: ${msg}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      setStatusMessage('');
    }
  };
  // Helpers de validación visual (CORREGIDOS PARA RETORNAR BOOLEAN SIEMPRE)
  const checkRes = (w?: number, h?: number) => (w === 1024 && h === 1792);
  const checkDur = (d?: number) => (typeof d === 'number' && d >= 15 && d <= 20);
  const checkFps = (f?: number) => (typeof f === 'number' && f >= 30);
  const getStatusColor = (isValid: boolean | undefined) => isValid ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
  return (
    <div className="space-y-6">
      {/* CUADRO DE ESPECIFICACIONES (Feedback en tiempo real) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2">📋 Especificaciones Técnicas del Video:</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="text-blue-800 border-b border-blue-200">
                <th className="py-2">Característica</th>
                <th className="py-2">Valor Esperado</th>
                <th className="py-2">Valor Detectado</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {/* Resolución */}
              <tr className="border-b border-blue-100">
                <td className="py-2 font-medium">Resolución</td>
                <td className="py-2">1024x1792</td>
                <td className={`py-2 ${file ? getStatusColor(checkRes(metadata?.width, metadata?.height)) : 'text-gray-400'}`}>
                  {file && metadata ? `${metadata.width}x${metadata.height}` : '-'}
                </td>
              </tr>
              {/* Duración */}
              <tr className="border-b border-blue-100">
                <td className="py-2 font-medium">Duración</td>
                <td className="py-2">15s - 20s</td>
                <td className={`py-2 ${file ? getStatusColor(checkDur(metadata?.duration)) : 'text-gray-400'}`}>
                  {file && metadata ? `${metadata.duration.toFixed(1)}s` : '-'}
                </td>
              </tr>
              {/* FPS */}
              <tr>
                <td className="py-2 font-medium">FPS</td>
                <td className="py-2">30 fps o +</td>
                <td className={`py-2 ${file ? getStatusColor(checkFps(metadata?.fps)) : 'text-gray-400'}`}>
                  {file && metadata ? `~${metadata.fps}` : '-'}
                </td>
              </tr>
              {/* Formato */}
              <tr>
                <td className="py-2 font-medium">Formato</td>
                <td className="py-2">MP4 / MOV</td>
                <td className={`py-2 ${file ? getStatusColor(file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.mov')) : 'text-gray-400'}`}>
                  {file ? file.name.split('.').pop()?.toUpperCase() : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* Dropzone */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-4 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-brand-purple bg-purple-50' : 'border-gray-300 hover:border-brand-purple hover:bg-gray-50'}`}
        >
          <input {...getInputProps()} />
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-xl font-semibold text-gray-700">Arrastra tu video aquí</p>
          <p className="text-gray-500">o clic para seleccionar</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6 bg-white flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="text-4xl">🎥</div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 break-all">{file.name}</p>
              <p className="text-sm text-gray-500 mb-2">{formatFileSize(file.size)}</p>
              {isUploading && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-brand-purple">{statusMessage}</span>
                    <span className="font-bold text-brand-purple">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-brand-purple h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
          {!isUploading && (
            <button onClick={() => { setFile(null); setMetadata(null); setError(null); }} className="text-gray-400 hover:text-red-500">
              ❌
            </button>
          )}
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {file && !isUploading && (
        <div className="flex gap-4">
          <Button
            onClick={handleUpload}
            className="flex-1"
            size="lg"
            variant={(checkRes(metadata?.width, metadata?.height) && checkDur(metadata?.duration) && checkFps(metadata?.fps)) ? "primary" : "outline"} // Visual warning style
          >
            {/* Logic for Alert Icon/Text */}
            {(!checkRes(metadata?.width, metadata?.height) || !checkDur(metadata?.duration) || !checkFps(metadata?.fps)) ? '⚠️ Subir Video (Con Advertencias)' : '⬆️ Subir Video'}
          </Button>
          <Button onClick={() => { setFile(null); setMetadata(null); }} variant="outline" size="lg">Cancelar</Button>
        </div>
      )}
    </div>
  );
}
