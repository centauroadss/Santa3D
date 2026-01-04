'use client';
import { useEffect, useState } from 'react';
import React from 'react';
import axios from 'axios';
import { ChevronDown, ChevronRight, Search, FileVideo, UserCheck, Calculator, Instagram, Clock, Calendar, ThumbsUp, Lock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import Input from '@/components/ui/Input';

// [V1] - INTERFACES UPDATED FOR ROBUSTNESS
interface CriterionScore {
    name: string;
    weight: number;
    score: number;
}

interface Evaluation {
    judge?: { name: string };
    judgeName?: string;
    score?: number;
    puntajeTotal?: number;
    comments?: string;
    observacionesGenerales?: string;
    evaluatedAt: string;
    criterionScores?: CriterionScore[];
    creativityScore?: number;
    techniqueScore?: number;
    fidelityScore?: number;
}

interface VerificationResult {
    id: string;
    participantName: string;
    email: string;
    instagram: string;
    alias: string;
    videoUrl: string;
    thumbnail: string | null;
    status: string;
    uploadedAt: string;

    // [V1] - NEW TECH SPECS FIELDS
    resolution: string;
    fps: number;
    duration: number;

    // [V1] - NEW LIKES DATA
    likes: number;
    closingLikes: number;
    closingLikesAt: string | null;

    evaluations: Evaluation[];
    averageScore: number;
    voteCount?: number;
}

// [V1] - HELPER FUNCTIONS
const formatDuration = (seconds: number) => {
    if (!seconds) return '-';
    return `${seconds.toFixed(1)}s`;
};

const getJudgeName = (evalItem: Evaluation) => {
    return evalItem.judgeName || evalItem.judge?.name || 'Juez';
}

const getTotalScore = (evalItem: Evaluation) => {
    if (evalItem.score !== undefined) return evalItem.score;
    if (evalItem.puntajeTotal !== undefined) return evalItem.puntajeTotal;

    const c = evalItem.creativityScore || 0;
    const t = evalItem.techniqueScore || 0;
    const f = evalItem.fidelityScore || 0;
    if (c || t || f) return (c * 0.4 + t * 0.3 + f * 0.3);

    return 0;
}

const getComments = (evalItem: Evaluation) => {
    return evalItem.comments || evalItem.observacionesGenerales || '-';
}

const getScoreByName = (evalItem: Evaluation, name: string) => {
    if (evalItem.criterionScores && Array.isArray(evalItem.criterionScores)) {
        const criterion = evalItem.criterionScores.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
        if (criterion) return criterion.score;
    }
    const lowerName = name.toLowerCase();
    if (lowerName.includes('creat')) return evalItem.creativityScore || 0;
    if (lowerName.includes('téc') || lowerName.includes('tech')) return evalItem.techniqueScore || 0;
    if (lowerName.includes('fid')) return evalItem.fidelityScore || 0;
    return 0;
};

export default function ResultsPage() {
    const [results, setResults] = useState<VerificationResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    // [V1] - TOGGLE STATE
    const [showTechSpecs, setShowTechSpecs] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await axios.get('/api/admin/results', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // [V1] - ROBUST DATA PARSING (ANTI-CRASH)
            let data = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                data = response.data.data;
            }

            const sorted = data.sort((a: any, b: any) => (b.averageScore || 0) - (a.averageScore || 0));
            setResults(sorted);
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const filteredResults = results.filter(row =>
        (row.participantName || '').toLowerCase().includes(search.toLowerCase()) ||
        (row.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (row.alias || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando resultados...</div>;

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Tablero de Resultados</h1>
                <div className="flex gap-2">
                    {/* [V1] - TOGGLE BUTTON */}
                    <button
                        onClick={() => setShowTechSpecs(!showTechSpecs)}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                        {showTechSpecs ? 'Ocultar Specs' : 'Ver Specs'}
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#1a1b2e] text-white uppercase text-xs">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <UserCheck size={16} className="mx-auto" />
                                </th>
                                <th className="px-6 py-4">Participante</th>

                                {/* [V1] - TECH SPECS HEADERS */}
                                {showTechSpecs && (
                                    <>
                                        <th className="px-2 py-3 text-center w-20">
                                            <div className="flex flex-col">
                                                <span>RES</span>
                                                <span className="text-[9px] text-gray-400 font-normal">1024x1792</span>
                                            </div>
                                        </th>
                                        <th className="px-2 py-3 text-center w-16">
                                            <div className="flex flex-col">
                                                <span>FPS</span>
                                                <span className="text-[9px] text-gray-400 font-normal">30 o+</span>
                                            </div>
                                        </th>
                                        <th className="px-2 py-3 text-center w-16">
                                            <div className="flex flex-col">
                                                <span>DUR</span>
                                                <span className="text-[9px] text-gray-400 font-normal">15-20s</span>
                                            </div>
                                        </th>
                                    </>
                                )}

                                <th className="px-4 py-4 text-center">Cronología</th>
                                <th className="px-4 py-4 text-center">Social</th>
                                <th className="px-4 py-4 text-center">Votos</th>
                                <th className="px-6 py-4 text-right">Resultados</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredResults.map((row) => {
                                // [V1] - VALIDATION LOGIC
                                const isResOk = row.resolution === '1024x1792';
                                const fpsVal = typeof row.fps === 'string' ? parseFloat(row.fps) : row.fps;
                                const isFpsOk = fpsVal && fpsVal >= 30;
                                const durVal = typeof row.duration === 'string' ? parseFloat(row.duration) : row.duration;
                                const isDurOk = durVal && durVal >= 15 && durVal <= 20;
                                const okClass = 'text-green-600 font-bold';
                                const errClass = 'text-red-500 font-bold';

                                const evaluations = row.evaluations || [];
                                const votesCount = row.voteCount !== undefined ? row.voteCount : evaluations.length;

                                return (
                                    <React.Fragment key={row.id}>
                                        <tr
                                            className="hover:bg-gray-50/50 transition-colors w-full border-l-4 border-l-green-500"
                                            onClick={() => toggleRow(row.id)}
                                        >
                                            <td className="px-4 py-4 text-center cursor-pointer">
                                                {expandedRows.has(row.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {/* VIDEO THUMBNAIL */}
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); row.thumbnail && setSelectedVideo(row.thumbnail) }}
                                                        className={`w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 overflow-hidden relative shrink-0 ${row.thumbnail ? 'cursor-pointer hover:ring-2 hover:ring-purple-400 hover:shadow-md transition-all' : ''}`}
                                                    >
                                                        {row.thumbnail ? (
                                                            <video src={row.thumbnail} className="w-full h-full object-cover pointer-events-none" muted />
                                                        ) : (
                                                            <FileVideo size={20} />
                                                        )}
                                                    </div>
                                                    {/* [V1] - VERTICAL LAYOUT */}
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-gray-900 truncate max-w-[150px]">{row.participantName}</div>
                                                        <div className="text-xs text-brand-purple truncate max-w-[150px]">{row.alias}</div>
                                                        <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <Instagram size={10} />
                                                            <span className="truncate max-w-[120px]">{row.instagram}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* [V1] - TECH SPECS DATA */}
                                            {showTechSpecs && (
                                                <>
                                                    <td className={`px-2 py-3 text-center font-mono text-xs ${isResOk ? okClass : errClass}`}>
                                                        <div className="flex flex-col">
                                                            <span>{row.resolution?.split('x')[0] || '-'}</span>
                                                            <span className="text-[9px] opacity-75">x{row.resolution?.split('x')[1] || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className={`px-2 py-3 text-center font-mono text-xs ${isFpsOk ? okClass : errClass}`}>
                                                        {row.fps || '-'}
                                                    </td>
                                                    <td className={`px-2 py-3 text-center font-mono text-xs ${isDurOk ? okClass : errClass}`}>
                                                        {formatDuration(row.duration)}
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div>
                                                        <div className="text-[10px] uppercase text-gray-400 font-bold leading-tight">Evaluación</div>
                                                        <div className="text-xs font-bold text-gray-900">
                                                            {evaluations.length > 0 ? (
                                                                format(new Date(Math.max(...evaluations.map(e => new Date(e.evaluatedAt).getTime()))), 'dd/MM HH:mm')
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] uppercase text-gray-400 font-bold leading-tight">Inscripción</div>
                                                        <div className="text-xs font-bold text-gray-900">
                                                            {format(new Date(row.uploadedAt), 'dd/MM HH:mm')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* [V1] - SOCIAL & CLOSING LIKES */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="text-xs font-bold flex items-center gap-1 text-pink-600" title="Likes Actuales">
                                                        <ThumbsUp size={12} />
                                                        {row.likes}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full" title="Likes al Cierre">
                                                        <Lock size={10} />
                                                        {row.closingLikes || '-'}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="text-sm font-bold flex items-center gap-1 text-green-600" title="Votos Recibidos">
                                                        <CheckCircle2 size={14} />
                                                        {votesCount}
                                                    </div>
                                                    {(5 - votesCount) > 0 && (
                                                        <div className="text-[10px] text-orange-500 flex items-center gap-1 font-medium">
                                                            <AlertCircle size={10} />
                                                            {5 - votesCount}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="text-3xl font-black text-gray-900 tracking-tight">
                                                    {row.averageScore ? row.averageScore.toFixed(1) : '-'}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Promedio</div>
                                            </td>
                                        </tr>

                                        {/* EXPANDED DETAILS */}
                                        {expandedRows.has(row.id) && (
                                            <tr>
                                                <td colSpan={showTechSpecs ? 9 : 6} className="bg-gray-50 px-8 py-4 border-b border-gray-100 shadow-inner">
                                                    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-gray-50 text-gray-500">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">Juez</th>
                                                                    <th className="px-4 py-2 text-right">Creatividad (40%)</th>
                                                                    <th className="px-4 py-2 text-right">Técnica (30%)</th>
                                                                    <th className="px-4 py-2 text-right">Fidelidad (30%)</th>
                                                                    <th className="px-4 py-2 text-right font-bold text-gray-900">Total</th>
                                                                    <th className="px-4 py-2 text-left w-1/3">Comentarios</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {evaluations.map((evalItem, idx) => (
                                                                    <tr key={idx} className="hover:bg-blue-50/50">
                                                                        <td className="px-4 py-2 font-medium text-gray-900">{getJudgeName(evalItem)}</td>
                                                                        <td className="px-4 py-2 text-right text-gray-600">{getScoreByName(evalItem, 'creativ')}</td>
                                                                        <td className="px-4 py-2 text-right text-gray-600">{getScoreByName(evalItem, 'téc') || getScoreByName(evalItem, 'tech')}</td>
                                                                        <td className="px-4 py-2 text-right text-gray-600">{getScoreByName(evalItem, 'fid')}</td>
                                                                        <td className="px-4 py-2 text-right font-bold text-brand-purple text-sm">
                                                                            {getTotalScore(evalItem).toFixed(1)}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-gray-500 italic truncate max-w-xs">
                                                                            {getComments(evalItem)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setSelectedVideo(null)}>
                    <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-black" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full"><X size={20} /></button>
                        <video src={selectedVideo} className="w-full h-auto max-h-[85vh]" controls autoPlay />
                    </div>
                </div>
            )}
        </div>
    );
}
