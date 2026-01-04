
import React from 'react';
import { CleanStorageService } from '@/lib/clean_storage';

// Enable dynamic rendering to fetch fresh data
export const dynamic = 'force-dynamic';

export default async function TestVideosPage() {
    const files = await CleanStorageService.listFiles(50);

    // Helper to generate a playback URL for a file
    // Since this is a Server Component, we can generate the Signed URL right here loop?
    // Or better: Generate it on demand. 
    // For simplicity (user asked for "boton para reproducir"), let's pre-generate URLs for the list.
    // Ideally this is heavy, but for a test page of 50 items it's fine.

    const videosWithUrls = await Promise.all(files.map(async (file) => {
        if (!file.Key) return null;
        try {
            const url = await CleanStorageService.getSignedUrl(file.Key);
            return { ...file, signedUrl: url };
        } catch (e) {
            return { ...file, signedUrl: null, error: 'Failed to sign' };
        }
    }));

    const validVideos = videosWithUrls.filter(Boolean);

    return (
        <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-blue-800">Santa 3D - Diagnóstico de Videos (Greenfield)</h1>
            <p className="mb-4 text-gray-700">
                Esta página lista los archivos directamente desde DigitalOcean usando la lógica de conexión corregida (Clean Architecture).
                Si los videos se ven aquí, la conexión y permisos están perfectos.
            </p>

            {validVideos.length === 0 ? (
                <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                    No se encontraron videos (o falló el listado).
                    <br />
                    Nota: Si el listado falla, es posible que los permisos de la API Key no incluyan "ListBucket".
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {validVideos.map((video: any, idx: number) => (
                        <div key={idx} className="bg-white rounded shadow p-4 border border-gray-200">
                            <h3 className="font-semibold text-sm truncate mb-2 text-gray-800" title={video.Key}>
                                {video.Key}
                            </h3>
                            <div className="text-xs text-gray-500 mb-2">
                                Size: {(video.Size / 1024 / 1024).toFixed(2)} MB
                            </div>

                            {video.signedUrl ? (
                                <div className="relative pt-[56.25%] bg-black rounded overflow-hidden">
                                    <video
                                        controls
                                        className="absolute top-0 left-0 w-full h-full"
                                        src={video.signedUrl}
                                        preload="metadata"
                                    >
                                        Tu navegador no soporta video.
                                    </video>
                                </div>
                            ) : (
                                <div className="text-red-500 text-sm">Error generando URL</div>
                            )}

                            <div className="mt-2 text-xs break-all text-gray-400">
                                <a href={video.signedUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 underline">
                                    Abrir Video en Pestaña Nueva
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
