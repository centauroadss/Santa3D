'use client';
import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useDropzone } from 'react-dropzone';

type Categoria = 'RENDER' | 'IA' | 'AMBAS';

type VideoMeta = {
    file: File | null;
    previewUrl: string | null;
    duration: number | null;
    resolution: string | null;
    sizeBytes: number | null;
    error: string | null;
    uploadProgress: number;
};

export default function VideoUploadClient({ tokenVideo, categoria }: { tokenVideo: string, categoria: Categoria }) {
    const [videos, setVideos] = useState<Record<'RENDER' | 'IA', VideoMeta>>({
        RENDER: { file: null, previewUrl: null, duration: null, resolution: null, sizeBytes: null, error: null, uploadProgress: 0 },
        IA: { file: null, previewUrl: null, duration: null, resolution: null, sizeBytes: null, error: null, uploadProgress: 0 }
    });
    const [isUploading, setIsUploading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (type: 'RENDER' | 'IA', selectedFile: File | undefined) => {
        if (!selectedFile) return;

        let error = null;
        if (selectedFile.size > 500 * 1024 * 1024) {
            error = 'El video supera el límite de 500MB.';
        } else if (selectedFile.type !== 'video/mp4') {
            error = 'Solo se permiten archivos en formato MP4.';
        }

        setVideos(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                file: error ? null : selectedFile,
                previewUrl: error ? null : URL.createObjectURL(selectedFile),
                sizeBytes: error ? null : selectedFile.size,
                error,
                uploadProgress: 0
            }
        }));
    };

    const handleVideoLoad = (type: 'RENDER' | 'IA', videoEl: HTMLVideoElement) => {
        const duration = videoEl.duration;
        const resolution = `${videoEl.videoWidth}x${videoEl.videoHeight}`;

        // Validate strictly for warnings
        let warning = null;
        if (Math.round(duration) !== 30 || videoEl.videoWidth !== 1024 || videoEl.videoHeight !== 2048) {
            warning = `Advertencia: Detectamos desviaciones. Se espera 1024x2048 y 30s. Subiremos tu archivo, pero se registrarán las diferencias.`;
        }

        setVideos(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                duration,
                resolution,
                error: warning // We use 'error' field but visually we'll treat it as a warning if file is present
            }
        }));
    };

    const handleUpload = async () => {
        setGlobalError(null);
        
        const typesToUpload: ('RENDER' | 'IA')[] = categoria === 'AMBAS' ? ['RENDER', 'IA'] : [categoria];
        
        for (const type of typesToUpload) {
            if (!videos[type].file) {
                setGlobalError(`Debes subir un video para la categoría ${type}.`);
                return;
            }
        }

        try {
            setIsUploading(true);
            const uploadedVideosData = [];

            for (const type of typesToUpload) {
                const meta = videos[type];
                
                // Step 1: Get Pre-signed URL
                const { data: presignedData } = await axios.post('/api/copa2026/video-upload/presigned', {
                    tokenVideo,
                    fileName: meta.file!.name,
                    fileType: meta.file!.type,
                    fileCategory: type
                });

                // Step 2: Upload to S3 directly with progress
                await axios.put(presignedData.uploadUrl, meta.file, {
                    headers: {
                        'Content-Type': meta.file!.type,
                        'x-amz-acl': 'public-read'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || meta.file!.size));
                        setVideos(prev => ({
                            ...prev,
                            [type]: {
                                ...prev[type],
                                uploadProgress: percentCompleted
                            }
                        }));
                    }
                });

                uploadedVideosData.push({
                    urlVideo: presignedData.videoUrl,
                    fileName: meta.file!.name,
                    fileType: meta.file!.type,
                    sizeBytes: meta.sizeBytes,
                    durationSeg: meta.duration,
                    resolution: meta.resolution,
                    categoriaVideo: type
                });
            }

            // Step 3: Confirm Upload
            await axios.post('/api/copa2026/video-upload/confirm', {
                tokenVideo,
                videos: uploadedVideosData
            });

            setSuccess(true);
        } catch (err: any) {
            console.error('Error uploading video:', err);
            setGlobalError('Hubo un error al subir los videos. Por favor intenta de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-12">
                <CheckCircle className="mx-auto text-green-500 mb-6" size={64} />
                <h2 className="text-2xl font-bold text-white mb-4">¡Obras Subidas Exitosamente!</h2>
                <p className="text-gray-400">Tu inscripción en la Copa 2026 ha sido completada formalmente. Ahora tus videos pasarán a revisión por curaduría.</p>
            </div>
        );
    }

    const DropzoneArea = ({ type }: { type: 'RENDER' | 'IA' }) => {
        const onDrop = useCallback((acceptedFiles: File[]) => {
            if (acceptedFiles && acceptedFiles.length > 0) {
                handleFileChange(type, acceptedFiles[0]);
            }
        }, [type]);

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop,
            accept: { 'video/mp4': ['.mp4'] },
            maxFiles: 1
        });

        return (
            <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors relative ${isDragActive ? 'border-brand-purple bg-brand-purple/10' : 'border-white/20 hover:border-brand-purple/50 bg-[#111]'}`}
            >
                <input {...getInputProps()} />
                <Upload className={`mx-auto mb-4 ${isDragActive ? 'text-brand-purple' : 'text-gray-400'}`} size={40} />
                <p className="text-lg font-bold text-white mb-2">
                    {isDragActive ? 'Suelta el archivo aquí...' : 'Haz clic o arrastra tu MP4 aquí'}
                </p>
                <p className="text-sm text-gray-500">Video {type} (1024x2048, 25s-30s)</p>
            </div>
        );
    };

    const renderDropzone = (type: 'RENDER' | 'IA') => {
        const meta = videos[type];
        
        return (
            <div className="mb-8" key={type}>
                <h4 className="text-xl font-bold text-white mb-4">Video Categoría: {type}</h4>
                
                {meta.error && !meta.file && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 mb-4">
                        <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                        <p className="font-medium text-sm">{meta.error}</p>
                    </div>
                )}
                {meta.error && meta.file && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-xl flex items-start gap-3 mb-4">
                        <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                        <p className="font-medium text-sm">{meta.error}</p>
                    </div>
                )}

                {!meta.file ? (
                    <DropzoneArea type={type} />
                ) : (
                    <div className="bg-[#111] rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                        {isUploading && (
                            <div className="absolute top-0 left-0 h-1 bg-brand-purple transition-all duration-300 z-10" style={{ width: `${meta.uploadProgress}%` }}></div>
                        )}
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-white">{meta.file.name}</p>
                                    <p className="text-xs text-gray-500">{(meta.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setVideos(prev => ({ ...prev, [type]: { file: null, previewUrl: null, duration: null, resolution: null, sizeBytes: null, error: null, uploadProgress: 0 } }))}
                                className="text-gray-400 hover:text-red-400 p-2"
                                disabled={isUploading}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative rounded-xl overflow-hidden bg-black aspect-[1024/2048] max-h-[300px] w-auto mx-auto mb-2 flex justify-center border border-white/10">
                            {meta.previewUrl && (
                                <video 
                                    src={meta.previewUrl} 
                                    onLoadedMetadata={(e) => handleVideoLoad(type, e.currentTarget)}
                                    controls 
                                    className="h-full object-contain"
                                />
                            )}
                        </div>
                        {meta.duration && (
                            <div className="mt-4 bg-[#111] rounded-xl border border-white/10 overflow-hidden text-sm">
                                <table className="w-full text-left text-gray-300">
                                    <thead className="bg-white/5 text-white text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Dato</th>
                                            <th className="px-4 py-3 font-medium">Esperado</th>
                                            <th className="px-4 py-3 font-medium">Determinado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 bg-black/40">
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white/80">Resolución</td>
                                            <td className="px-4 py-3 font-mono text-xs">1024x2048</td>
                                            <td className={`px-4 py-3 font-mono text-xs font-bold ${meta.resolution === '1024x2048' ? 'text-green-400' : 'text-yellow-400'}`}>{meta.resolution}</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white/80">Duración</td>
                                            <td className="px-4 py-3 font-mono text-xs">25s - 30s</td>
                                            <td className={`px-4 py-3 font-mono text-xs font-bold ${(meta.duration >= 25 && meta.duration <= 31) ? 'text-green-400' : 'text-yellow-400'}`}>{meta.duration.toFixed(1)}s</td>
                                        </tr>
                                        <tr className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white/80">Formato</td>
                                            <td className="px-4 py-3 font-mono text-xs">video/mp4</td>
                                            <td className={`px-4 py-3 font-mono text-xs font-bold ${meta.file.type === 'video/mp4' ? 'text-green-400' : 'text-yellow-400'}`}>{meta.file.type}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {isUploading && (
                            <p className="text-center text-xs text-brand-purple font-bold mt-2">Subiendo... {meta.uploadProgress}%</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-brand-purple/10 border border-brand-purple/20 p-6 rounded-2xl mb-8">
                <h3 className="text-brand-purple font-bold mb-3 flex items-center gap-2">
                    <AlertCircle size={18} /> Parámetros Estrictos del Video
                </h3>
                <ul className="text-sm text-gray-300 space-y-2 list-disc pl-5">
                    <li>Resolución Exacta: <strong className="text-white">1024 x 2048 píxeles</strong></li>
                    <li>Duración Exacta: <strong className="text-white">Entre 25 y 30 segundos</strong></li>
                    <li>Formato: <strong className="text-white">MP4 (H.264)</strong></li>
                    <li>Peso Máximo: <strong className="text-white">500 MB</strong></li>
                </ul>
            </div>

            {globalError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 mb-6">
                    <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
                    <p className="font-medium text-sm">{globalError}</p>
                </div>
            )}

            {categoria === 'AMBAS' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderDropzone('RENDER')}
                    {renderDropzone('IA')}
                </div>
            ) : (
                renderDropzone(categoria)
            )}

            <Button 
                onClick={handleUpload} 
                className="w-full mt-8" 
                isLoading={isUploading}
            >
                {isUploading ? 'Subiendo Obras...' : 'Confirmar y Enviar Obras'}
            </Button>
        </div>
    );
}
