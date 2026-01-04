'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { Play, X } from 'lucide-react';

interface CriterionScore {
    id: string;
    puntaje: number;
    criterion: {
        nombre: string;
        peso: number;
        puntajeMaximo: number;
    };
}

interface Evaluation {
    id: string;
    puntajeTotal: number;
    evaluatedAt: string;
    observacionesGenerales?: string;
    criterionScores: CriterionScore[];
}

interface Video {
    id: string;
    fileName: string;
    streamUrl: string;
    uploadedAt: string;
    participant: {
        alias: string;
        instagram: string;
    };
    resolution?: string; // New
    duration?: number;   // New
    fps?: number;        // New
    evaluation?: Evaluation;
    stats?: {
        totalVotes: number;
        pendingVotes: number;
    };
}

interface Props {
    videos: Video[];
    onEdit?: (video: Video) => void;
}

export default function EvaluatedVideosTable({ videos, onEdit }: Props) {
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    // Solo guardar videos que tienen evaluación
    const evaluatedVideos = videos.filter(v => v.evaluation);

    if (evaluatedVideos.length === 0) {
        return <div className="text-center py-8 text-gray-500">No hay videos evaluados aún.</div>;
    }

    // Extraer criterios del primer video para generar columnas dinámicas
    const firstEval = evaluatedVideos[0].evaluation!;
    const criteriaHeaders = firstEval.criterionScores
        .map(cs => cs.criterion)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const formatDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const diffMins = differenceInMinutes(endDate, startDate);
        const diffHours = differenceInHours(endDate, startDate);
        const diffDays = differenceInDays(endDate, startDate);

        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
        return `${diffMins} min`;
    };

    // Helper para validar reglas visuales (Misma lógica que TechnicalReportTable)
    const getStatusClass = (isValid: boolean) => isValid ? 'text-green-600 font-bold' : 'text-red-500 font-bold';

    // Reglas "Hardcoded" para la vista de lista
    const checkRes = (val?: string) => val === '1024x1792';
    const checkDur = (val?: number) => val ? (val >= 15 && val <= 20.5) : false;
    const checkFps = (val?: number) => val ? (Math.round(val) === 30) : false;

    return (
        <>
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-bold">Identificación</th>
                            <th className="px-4 py-3">Fechas</th>

                            {/* --- Technical Columns --- */}
                            <th className="px-4 py-3 text-center border-l border-gray-200">
                                <div className="font-bold text-gray-700">Resolución</div>
                                <div className="text-[10px] text-gray-400 font-normal">1024x1792</div>
                            </th>
                            <th className="px-4 py-3 text-center border-l border-gray-200">
                                <div className="font-bold text-gray-700">Duración</div>
                                <div className="text-[10px] text-gray-400 font-normal">15s - 20s</div>
                            </th>
                            <th className="px-4 py-3 text-center border-l border-gray-200">
                                <div className="font-bold text-gray-700">FPS</div>
                                <div className="text-[10px] text-gray-400 font-normal">30</div>
                            </th>
                            {/* ------------------------- */}

                            <th className="px-4 py-3 text-center border-l border-gray-200">Tiempo</th>

                            {/* Columnas Dinámicas de Criterios */}
                            {criteriaHeaders.map((c) => (
                                <th key={c.nombre} className="px-2 py-3 text-center min-w-[100px]">
                                    <div className="font-bold text-gray-700">{c.nombre}</div>
                                    <div className="text-[10px] text-gray-400 font-normal">
                                        {c.peso}% (Max {c.puntajeMaximo})
                                    </div>
                                </th>
                            ))}

                            <th className="px-4 py-3 text-center font-black text-gray-900 border-l border-gray-100 bg-gray-100/50">Total</th>
                            <th className="px-4 py-3 text-center">Comentarios</th>
                            <th className="px-4 py-3 text-center">Video</th>
                            {onEdit && <th className="px-4 py-3 text-center">Edición</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {evaluatedVideos.map((video) => {
                            const evalData = video.evaluation!;
                            const scoresMap = new Map(evalData.criterionScores.map(cs => [cs.criterion.nombre, cs.puntaje]));

                            // Validation Check
                            const isResValid = checkRes(video.resolution);
                            const isDurValid = checkDur(video.duration);
                            const isFpsValid = checkFps(video.fps);

                            return (
                                <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                                    {/* Identificación */}
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-gray-900">{video.participant.instagram}</div>
                                        <div className="text-xs text-gray-500">{video.participant.alias}</div>
                                    </td>

                                    {/* Fechas */}
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-xs">
                                            <span className="text-gray-500 font-medium">Subido:</span> <span className="text-gray-900 font-bold">{format(new Date(video.uploadedAt), 'dd/MM HH:mm')}</span>
                                        </div>
                                        <div className="text-xs mt-0.5">
                                            <span className="text-brand-purple font-medium">Evaluado:</span> <span className="text-gray-900 font-bold">{format(new Date(evalData.evaluatedAt), 'dd/MM HH:mm')}</span>
                                        </div>
                                    </td>

                                    {/* --- Technical Data Cells --- */}
                                    <td className={`px-4 py-3 text-center text-xs border-l border-gray-100 ${getStatusClass(isResValid)}`}>
                                        {video.resolution || 'N/A'}
                                    </td>
                                    <td className={`px-4 py-3 text-center text-xs border-l border-gray-100 ${getStatusClass(isDurValid)}`}>
                                        {video.duration ? video.duration.toFixed(1) + 's' : 'N/A'}
                                    </td>
                                    <td className={`px-4 py-3 text-center text-xs border-l border-gray-100 ${getStatusClass(isFpsValid)}`}>
                                        {video.fps ? Math.round(video.fps) : 'N/A'}
                                    </td>
                                    {/* ---------------------------- */}

                                    {/* Tiempo */}
                                    <td className="px-4 py-3 text-center font-mono text-xs font-medium text-gray-600 border-l border-gray-100">
                                        {formatDuration(video.uploadedAt, evalData.evaluatedAt)}
                                    </td>

                                    {/* Scores Individuales */}
                                    {criteriaHeaders.map((c) => (
                                        <td key={c.nombre} className="px-2 py-3 text-center">
                                            <span className="font-bold text-gray-700">
                                                {scoresMap.get(c.nombre)?.toFixed(1) || '-'}
                                            </span>
                                        </td>
                                    ))}

                                    {/* Total */}
                                    <td className="px-4 py-3 text-center border-l border-gray-100 bg-brand-purple/5">
                                        <span className="text-lg font-black text-brand-purple">
                                            {evalData.puntajeTotal.toFixed(1)}
                                        </span>
                                    </td>

                                    {/* Comentarios (Tooltip) */}
                                    <td className="px-4 py-3 text-center">
                                        {evalData.observacionesGenerales ? (
                                            <div className="group relative inline-block">
                                                <span className="cursor-help font-black text-gray-900 text-sm border-b border-dotted border-gray-400">
                                                    SI
                                                </span>
                                                {/* Tooltip */}
                                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-64 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left">
                                                    <div className="font-bold mb-1 text-gray-300 border-b border-gray-700 pb-1">Observaciones</div>
                                                    <p className="leading-relaxed">{evalData.observacionesGenerales}</p>
                                                    {/* Arrow */}
                                                    <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-gray-900"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-gray-900 text-sm">NO</span>
                                        )}
                                    </td>

                                    {/* Video Link */}
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => setSelectedVideo(video)}
                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple text-white hover:bg-purple-700 transition-colors mx-auto"
                                            title="Ver Video"
                                        >
                                            <Play size={14} fill="currentColor" />
                                        </button>
                                    </td>

                                    {/* Edcición Link */}
                                    {onEdit && <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => onEdit(video)}
                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors mx-auto"
                                            title="Editar Evaluación"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                    </td>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <button
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-[110]"
                    >
                        <X size={32} />
                    </button>

                    <div
                        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
                        style={{
                            width: 'calc(80vh / 1.75)',
                            maxWidth: '100%',
                            height: '80vh',
                            maxHeight: '100%'
                        }}
                    >
                        {/* Video Layer */}
                        <div
                            className="relative flex-1 bg-black overflow-hidden group"
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <video
                                src={selectedVideo.streamUrl}
                                controls
                                controlsList="nodownload"
                                disablePictureInPicture
                                onContextMenu={(e) => e.preventDefault()}
                                autoPlay
                                className="w-full h-full object-cover"
                            >
                                Tu navegador no soporta el tag de video.
                            </video>

                            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                                <div className="font-bold text-white text-lg">{selectedVideo.participant.instagram}</div>
                                <div className="text-gray-300 text-sm">{selectedVideo.participant.alias}</div>
                            </div>
                        </div>

                        {/* Footer Info Layer */}
                        <div className="bg-white/10 backdrop-blur-md p-3 border-t border-white/10 text-xs text-white">
                            <div className="flex justify-between items-center gap-2">
                                <div className="text-center">
                                    <div className="text-gray-400 mb-0.5 uppercase tracking-wider text-[10px]">Evaluado</div>
                                    <div className="font-bold">
                                        {selectedVideo.evaluation?.evaluatedAt
                                            ? format(new Date(selectedVideo.evaluation.evaluatedAt), 'dd/MM/yyyy HH:mm')
                                            : '-'}
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-white/20"></div>
                                <div className="text-center">
                                    <div className="text-gray-400 mb-0.5 uppercase tracking-wider text-[10px]">Jueces Votaron</div>
                                    <div className="font-bold text-brand-purple text-sm">
                                        {selectedVideo.stats ? selectedVideo.stats.totalVotes : '-'}
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-white/20"></div>
                                <div className="text-center">
                                    <div className="text-gray-400 mb-0.5 uppercase tracking-wider text-[10px]">Pendientes</div>
                                    <div className="font-bold text-orange-400 text-sm">
                                        {selectedVideo.stats ? selectedVideo.stats.pendingVotes : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
