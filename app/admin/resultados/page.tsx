'use client';
import { useEffect, useState } from 'react';
import React from 'react';
import axios from 'axios';
import { ChevronDown, ChevronRight, Search, FileVideo, UserCheck, Calculator, Instagram, Clock, Calendar, ThumbsUp, Lock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import Input from '@/components/ui/Input';
import PDFExportResults from '@/components/admin/PDFExportResults';
import { Mail, Award } from 'lucide-react';
import jsPDF from 'jspdf';

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
    totalScoreSum?: number;
    voteCount?: number;
    isJudgeSelected: boolean;
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




    const [isContestClosed, setIsContestClosed] = useState(false);
    const [contestClosedAt, setContestClosedAt] = useState<string | null>(null);
    const [showPublicScores, setShowPublicScores] = useState(false);

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

            // Fetch Contest Settings
            try {
                const settingsRes = await axios.get('/api/admin/contest-settings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (settingsRes.data.success && settingsRes.data.data) {
                    setIsContestClosed(settingsRes.data.data.isClosed);
                    setContestClosedAt(settingsRes.data.data.closedAt);
                    setShowPublicScores(settingsRes.data.data.showPublicScores);
                }
            } catch (err) {
                console.error('Error loading settings', err);
            }

        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePublicScores = async () => {
        const newValue = !showPublicScores;
        try {
            // Optimistic update
            setShowPublicScores(newValue);
            const token = localStorage.getItem('admin_token');
            await axios.post('/api/admin/contest-settings', {
                showPublicScores: newValue
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error(error);
            setShowPublicScores(!newValue); // Revert
            alert('Error actualizando configuración de puntajes');
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

    const handleToggleJudge = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = !currentStatus;
        // Optimistic update
        setResults(prev => prev.map(r =>
            r.id === id ? { ...r, isJudgeSelected: newStatus } : r
        ));

        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post('/api/admin/videos/toggle-judge', {
                videoId: id,
                isSelected: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.data.success) {
                // Revert on failure
                alert('Error: ' + res.data.error);
                setResults(prev => prev.map(r =>
                    r.id === id ? { ...r, isJudgeSelected: currentStatus } : r
                ));
            }
        } catch (error: any) {
            console.error(error);
            alert('Error de conexión');
            // Revert on failure
            setResults(prev => prev.map(r =>
                r.id === id ? { ...r, isJudgeSelected: currentStatus } : r
            ));
        }
    };

    const handleCloseContest = async () => {
        if (!confirm('¿Estás seguro de que deseas CERRAR el concurso? Esto inhabilitará el botón de postulación.')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.post('/api/admin/contest-settings', {
                isClosed: true
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setIsContestClosed(true);
                setContestClosedAt(res.data.data.closedAt);
                alert('Concurso cerrado exitosamente.');
            }
        } catch (error) {
            console.error(error);
            alert('Error al cerrar el concurso');
        }
    };

    const handleSendCertificate = async (row: VerificationResult, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`¿Enviar Certificado de Participación a ${row.participantName}?`)) return;

        try {
            const loadingMsg = document.createElement('div');
            loadingMsg.id = 'loading-cert-mail';
            loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:10px;z-index:9999;';
            loadingMsg.innerText = '🎓 Generando Certificado y Enviando...';
            document.body.appendChild(loadingMsg);

            // 1. Generate PDF
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            // Background / Border
            doc.setLineWidth(2);
            doc.setDrawColor(133, 67, 154); // Purple
            doc.rect(10, 10, 277, 190);
            doc.setDrawColor(247, 145, 49); // Orange
            doc.rect(12, 12, 273, 186);

            // Header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(133, 67, 154); // Purple
            doc.text('CENTAURO ADS', 148.5, 40, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(100, 100, 100);
            doc.text('Reconoce la participación de:', 148.5, 60, { align: 'center' });

            // Name
            doc.setFontSize(36);
            doc.setTextColor(0, 0, 0);
            doc.text(row.participantName.toUpperCase(), 148.5, 85, { align: 'center' });
            doc.setLineWidth(0.5);
            doc.setDrawColor(200, 200, 200);
            doc.line(70, 90, 227, 90);

            // Context
            doc.setFontSize(16);
            doc.setTextColor(80, 80, 80);
            doc.text('Por haber completado exitosamente su participación en el reto:', 148.5, 110, { align: 'center' });

            doc.setFontSize(28);
            doc.setTextColor(247, 145, 49); // Orange
            doc.text('SANTA 3D VENEZOLANO 2025', 148.5, 125, { align: 'center' });

            // Stats (Optional, maybe nice)
            doc.setFontSize(10);
            doc.setTextColor(120, 120, 120);
            doc.text(`Resolución: ${row.resolution || '-'} | FPS: ${row.fps || '-'} | Duración: ${row.duration || '-'}s`, 148.5, 140, { align: 'center' });

            // Date & Sig
            doc.setFontSize(12);
            doc.setTextColor(50, 50, 50);
            doc.text('Caracas, Enero 2026', 148.5, 160, { align: 'center' });

            doc.setFontSize(10);
            doc.text('__________________________________', 148.5, 180, { align: 'center' });
            doc.text('Comité Organizador Centauro ADs', 148.5, 185, { align: 'center' });

            const pdfBase64 = doc.output('datauristring').split(',')[1];

            // 2. Send
            const token = localStorage.getItem('admin_token');
            const res = await axios.post(`/api/admin/participants/${row.id}/send-certificate`, {
                pdfBase64,
                email: row.email,
                name: row.participantName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            document.body.removeChild(loadingMsg);
            if (res.data.success) {
                alert(`✅ Certificado enviado a ${row.participantName}`);
            }

        } catch (e: any) {
            const el = document.getElementById('loading-cert-mail');
            if (el) document.body.removeChild(el);
            console.error(e);
            alert('Error enviando certificado: ' + e.message);
        }
    };



    const filteredResults = results.filter(row =>
        (row.participantName || '').toLowerCase().includes(search.toLowerCase()) ||
        (row.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (row.alias || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando resultados...</div>;

    // [V1] - GET CLOSING DATE FROM FIRST RECORD
    const closingDate = results.length > 0 && results[0].closingLikesAt
        ? format(new Date(results[0].closingLikesAt), 'dd/MM/yyyy HH:mm:ss')
        : null;

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Tablero de Resultados</h1>
                    {closingDate && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-mono">
                            <Clock size={12} className="text-pink-600" />
                            <span className="font-bold text-pink-700">CIERRE DE LIKES:</span> {closingDate}
                        </div>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    {/* SHOW SCORES TOGGLE */}
                    <button
                        onClick={togglePublicScores}
                        className={`px-4 py-2 text-sm font-bold min-w-[160px] border rounded-md shadow-sm transition-all flex items-center justify-center gap-2 ${showPublicScores
                            ? 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        title="Controla si el puntaje numérico es visible en el ranking público"
                    >
                        {showPublicScores ? (
                            <>
                                <CheckCircle2 size={16} />
                                Puntajes Visibles
                            </>
                        ) : (
                            <>
                                <Lock size={16} />
                                Puntajes Ocultos
                            </>
                        )}
                    </button>

                    {/* PDF EXPORT BUTTON */}
                    <PDFExportResults data={results} />

                    {/* CLOSE CONTEST BUTTON */}
                    {!isContestClosed ? (
                        <button
                            onClick={handleCloseContest}
                            className="px-4 py-2 text-sm font-bold bg-red-600 border border-red-700 rounded-md text-white hover:bg-red-700 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                            <Lock size={16} />
                            CERRAR CONCURSO (Inhabilitar Postulaciones)
                        </button>
                    ) : (
                        <div className="flex flex-col items-end">
                            <div className="px-4 py-2 text-sm font-bold bg-gray-800 border border-gray-700 rounded-md text-white flex items-center gap-2 cursor-not-allowed leading-none opacity-80">
                                <Lock size={16} />
                                CONCURSO CERRADO
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono mt-1">
                                {contestClosedAt ? new Date(contestClosedAt).toLocaleString() : ''}
                            </span>
                        </div>
                    )}

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


            {/* SUB-HEADER: REPORTE & LIKES DATE */}
            <div className="bg-white border-l-4 border-l-purple-600 shadow-sm rounded-r-lg p-4 mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                        <Calculator className="text-purple-600" />
                        Reporte de Resultados
                    </h3>
                    {/* LIKES CLOSING DATE DISPLAY */}
                    {closingDate ? (
                        <div className="text-sm text-gray-500 mt-1 font-mono flex items-center gap-2">
                            <Clock size={14} className="text-pink-600" />
                            <span className="font-bold text-gray-700">FECHA LIKES CIERRE:</span>
                            <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded border border-pink-200 font-bold">
                                {closingDate}
                            </span>
                        </div>
                    ) : (
                        <div className="text-sm text-red-500 mt-1 font-mono flex items-center gap-2">
                            <AlertCircle size={14} />
                            <span>Esperando Cierre de Likes...</span>
                        </div>
                    )}
                </div>

                {/* [V1] - TOGGLE BUTTON MOVED HERE FOR BETTER UX */}
                <button
                    onClick={() => setShowTechSpecs(!showTechSpecs)}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                >
                    {showTechSpecs ? 'Ocultar Specs' : 'Ver Specs'}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 w-12 text-center">
                                    <UserCheck size={16} className="mx-auto" />
                                </th>
                                <th className="px-6 py-3">Participante</th>

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

                                <th className="px-4 py-3 text-center">Cronología</th>
                                <th className="px-4 py-3 text-center">Certificado</th>
                                <th className="px-4 py-3 text-center">Social</th>
                                <th className="px-4 py-3 text-center">Votos</th>
                                <th className="px-6 py-3 text-right">Resultados</th>
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
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={(e) => handleToggleJudge(row.id, row.isJudgeSelected, e)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${row.isJudgeSelected ? 'bg-purple-600' : 'bg-gray-200'}`}
                                                        title={row.isJudgeSelected ? 'Visible para Jueces' : 'Oculto para Jueces'}
                                                    >
                                                        <span className={`${row.isJudgeSelected ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                    </button>

                                                    {/* Expand Chevron (Secondary Action) */}
                                                    <div className="cursor-pointer p-1 text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                                                        {expandedRows.has(row.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </div>
                                                </div>
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

                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={(e) => handleSendCertificate(row, e)}
                                                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded-full transition-colors"
                                                    title="Enviar Certificado de Participación"
                                                >
                                                    <Mail size={16} />
                                                </button>
                                            </td>

                                            {/* [V1] - SOCIAL & CLOSING LIKES */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {/* CLOSING LIKES (DOMINANT) */}
                                                    <div className="text-sm font-black flex items-center gap-1 text-gray-800" title="Likes al Cierre">
                                                        <Lock size={12} className="text-gray-400" />
                                                        {row.closingLikes}
                                                    </div>
                                                    {/* CURRENT LIKES (SECONDARY) */}
                                                    <div className="text-[10px] text-pink-600 font-medium flex items-center gap-1 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100" title="Likes Actuales">
                                                        <ThumbsUp size={8} />
                                                        {row.likes}
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
                                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-2">Promedio</div>

                                                {/* TOTAL SUM */}
                                                <div className="text-sm font-bold text-gray-500 mb-2">
                                                    {(row.totalScoreSum || 0).toFixed(1)} <span className="text-[10px] font-normal uppercase">Total</span>
                                                </div>

                                                {/* TOGGLE BUTTON */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}
                                                    className="text-xs font-bold text-brand-purple hover:text-purple-700 flex items-center justify-end gap-1 ml-auto transition-colors"
                                                >
                                                    {expandedRows.has(row.id) ? 'Ocultar' : 'Ver Detalle'}
                                                    {expandedRows.has(row.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Details Sub-Table from Backup */}
                                        {expandedRows.has(row.id) && (
                                            <tr className="bg-gray-50 border-b border-gray-200 shadow-inner">
                                                <td colSpan={showTechSpecs ? 9 : 6} className="p-0">
                                                    <div className="p-6">
                                                        <div className="bg-white border boundary-gray-200 rounded-lg shadow-sm overflow-hidden">
                                                            <h4 className="text-xs font-bold uppercase text-gray-500 p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                                                <Calculator size={14} />
                                                                Desglose de Calificaciones
                                                            </h4>
                                                            {row.evaluations.length > 0 ? (
                                                                <table className="w-full text-sm">
                                                                    <thead className="bg-gray-800 text-white font-black uppercase border-b border-gray-700">
                                                                        {/* Row 1: Weights */}
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left border-r border-gray-700 w-48"></th>
                                                                            <th className="px-4 py-2 text-left border-r border-gray-700 w-32 bg-gray-900/30"></th> {/* NEW DATE COL SPACING */}

                                                                            {row.evaluations[0]?.criterionScores?.map((c, idx) => (
                                                                                <th key={idx} className="px-4 py-2 text-center border-r border-gray-700">
                                                                                    <span className="text-xl font-black text-yellow-400">{c.weight}%</span>
                                                                                </th>
                                                                            ))}
                                                                            <th className="px-4 py-2 text-right"></th>
                                                                        </tr>
                                                                        {/* Row 2: Names */}
                                                                        <tr className="bg-gray-900/50 text-gray-300 text-xs">
                                                                            <th className="px-4 py-2 text-left border-r border-gray-700">Juez</th>
                                                                            <th className="px-4 py-2 text-left border-r border-gray-700 w-32">Fechas</th> {/* NEW COL HEADER */}

                                                                            {row.evaluations[0]?.criterionScores?.map((c, idx) => (
                                                                                <th key={idx} className="px-4 py-2 text-center font-medium border-r border-gray-700">
                                                                                    {c.name}
                                                                                </th>
                                                                            ))}
                                                                            <th className="px-4 py-2 text-right border-l border-gray-700 bg-gray-800">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100 text-gray-700">
                                                                        {row.evaluations.map((ev, i) => (
                                                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                                                {/* Judge Name and Comments */}
                                                                                <td className="px-4 py-3 border-r border-gray-100 align-top">
                                                                                    <div className="font-bold text-gray-900">{ev.judgeName}</div>
                                                                                    {/* Comment Status Indicator */}
                                                                                    {ev.comments && ev.comments !== 'Sin comentarios' ? (
                                                                                        <div className="group relative mt-1 inline-block">
                                                                                            <span className="cursor-help text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20 hover:bg-brand-purple hover:text-white transition-all">
                                                                                                Con comentarios
                                                                                            </span>
                                                                                            {/* Tooltip */}
                                                                                            <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-left pointer-events-none">
                                                                                                <div className="font-bold mb-1 text-gray-300 border-b border-gray-700 pb-1">Observaciones</div>
                                                                                                <p className="leading-relaxed whitespace-normal">{ev.comments}</p>
                                                                                                {/* Arrow pointing up */}
                                                                                                <div className="absolute left-4 bottom-full border-8 border-transparent border-b-gray-900"></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-[10px] text-gray-400 font-medium mt-1">
                                                                                            Sin comentarios
                                                                                        </div>
                                                                                    )}
                                                                                </td>

                                                                                {/* [NEW] DATE COLUMN (EXACT CLONE WITH SAFETY) */}
                                                                                <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100 align-top">
                                                                                    <div className="text-xs">
                                                                                        <span className="text-gray-500 font-medium">Subido:</span>
                                                                                        <span className="text-gray-900 font-bold ml-1">
                                                                                            {row.uploadedAt ? format(new Date(row.uploadedAt), 'dd/MM HH:mm') : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-xs mt-0.5">
                                                                                        <span className="text-brand-purple font-medium">Evaluado:</span>
                                                                                        <span className="text-gray-900 font-bold ml-1">
                                                                                            {ev.evaluatedAt ? format(new Date(ev.evaluatedAt), 'dd/MM HH:mm') : '-'}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>

                                                                                {/* Scores */}
                                                                                {/* Scores */}
                                                                                {ev.criterionScores?.map((score, sIdx) => (
                                                                                    <td key={sIdx} className="px-4 py-3 text-center text-gray-600 font-medium border-r border-gray-100 align-top pt-4">
                                                                                        {score.score.toFixed(1)}
                                                                                    </td>
                                                                                ))}
                                                                                {/* Total */}
                                                                                <td className="px-4 py-3 text-right font-black text-brand-purple bg-brand-purple/5 border-l border-brand-purple/10 align-top pt-4">
                                                                                    {(ev.score || 0).toFixed(1)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                        {/* Grand Total Row */}
                                                                        <tr className="bg-gray-100 font-black text-gray-900 border-t border-gray-300">
                                                                            <td className="px-4 py-2 text-right uppercase tracking-widest text-xs border-r border-gray-200">
                                                                                Totales:
                                                                            </td>
                                                                            {row.evaluations[0]?.criterionScores?.map((c, idx) => (
                                                                                <td key={idx} className="px-4 py-2 text-center text-gray-300 text-xs border-r border-gray-200">-</td>
                                                                            ))}
                                                                            <td className="px-4 py-2 text-right text-base text-blue-600 bg-blue-50 border-l border-blue-100">
                                                                                {row.totalScoreSum ? row.totalScoreSum.toFixed(1) : '0.0'}
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            ) : (
                                                                <div className="p-8 text-center text-gray-400 italic">
                                                                    No hay votos registrados para generar el desglose.
                                                                </div>
                                                            )}
                                                        </div>
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

            {
                selectedVideo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setSelectedVideo(null)}>
                        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-black" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full"><X size={20} /></button>
                            <video src={selectedVideo} className="w-full h-auto max-h-[85vh]" controls autoPlay />
                        </div>
                    </div>
                )
            }
        </div >
    );
}
