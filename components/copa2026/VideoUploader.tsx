'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface VideoUploaderProps {
    token: string;
    onUploadSuccess: (fileUrl: string, fileData: any) => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export default function VideoUploader({ token, onUploadSuccess }: VideoUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setError(null);

        // Client-side validations
        if (!file.type.startsWith('video/')) {
            setError('Solo se aceptan archivos de video (mp4, mov, avi, webm, etc.)');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError(`El archivo excede el tamaño máximo permitido (500 MB). Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            return;
        }

        setUploading(true);
        setProgress(10);

        try {
            // 1. Obtener la presigned URL
            const preRes = await fetch('/api/copa2026/upload/presigned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenVideo: token,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type
                })
            });

            const preData = await preRes.json();
            if (!preRes.ok || !preData.uploadUrl) {
                throw new Error(preData.error || 'No se pudo generar la URL de subida');
            }

            setProgress(30);

            // 2. Subir directo a S3 usando fetch / XMLHttpRequest para progreso
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', preData.uploadUrl, true);
                xhr.setRequestHeader('Content-Type', file.type);
                // The acl x-amz-acl is often required by spaces if public read is desired
                // If presigned URL doesn't include it in signature, we shouldn't send it unless signed.
                xhr.setRequestHeader('x-amz-acl', 'public-read'); 

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 60) + 30; // Scale 30-90%
                        setProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        resolve(true);
                    } else {
                        reject(new Error('Falló la subida al servidor de almacenamiento.'));
                    }
                };

                xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'));

                xhr.send(file);
            });

            setProgress(100);

            // 3. Informar éxito
            const fileData = {
                urlVideo: preData.videoUrl,
                fileName: file.name,
                sizeBytes: file.size,
                fileType: file.type,
                // Nota: ya no calculamos duracion/resolucion aquí porque el backend usa ffprobe
            };
            
            onUploadSuccess(preData.videoUrl, fileData);

        } catch (err: any) {
            console.error('Error en upload:', err);
            setError(err.message || 'Error desconocido al subir el video');
            setUploading(false);
            setProgress(0);
        }
    }, [token, onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv']
        },
        maxFiles: 1,
        disabled: uploading
    });

    return (
        <div className="w-full">
            <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-[#85439a] bg-[#85439a]/5' : 
                    isDragReject ? 'border-red-500 bg-red-50' : 
                    'border-gray-300 hover:border-[#85439a] hover:bg-gray-50'
                } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <input {...getInputProps()} />
                
                {!uploading && (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-[#85439a]/10 rounded-full text-[#85439a]">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-gray-700 font-medium">Arrastra tu video aquí, o haz clic para seleccionar</p>
                        <p className="text-sm text-gray-500">MP4, MOV, AVI o WEBM (Máx. 500 MB)</p>
                        <p className="text-xs font-bold text-[#85439a] mt-2">Obligatorio: 1024x2048, 30s, 30fps</p>
                    </div>
                )}

                {uploading && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#85439a]"></div>
                        <p className="text-gray-700 font-medium">Subiendo video... {progress}%</p>
                        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-2">
                            <div className="bg-[#85439a] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Por favor, no cierres esta pestaña</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
                    <p className="text-sm text-red-700 font-medium">⚠️ Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
        </div>
    );
}
