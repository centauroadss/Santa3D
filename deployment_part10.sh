#!/bin/bash
# 1. Update API to include instagram field
cat << 'ROUTE_EOF' > app/api/admin/results/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Authenticate as Admin
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get total number of judges to calculate pending votes
        const totalJudges = await prisma.judge.count();
        const videos = await prisma.video.findMany({
            where: { status: 'VALIDATED' },
            include: {
                participant: true,
                evaluations: {
                    include: {
                        judge: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true
                            }
                        },
                        criterionScores: {
                            include: {
                                criterion: true
                            }
                        }
                    }
                }
            }
        });
        const results = videos.map(video => {
            const voteCount = video.evaluations.length;
            const pendingCount = totalJudges - voteCount;
            const totalScoreSum = video.evaluations.reduce((acc, curr) => acc + curr.puntajeTotal, 0);
            const averageScore = voteCount > 0 ? (totalScoreSum / voteCount) : 0;
            return {
                id: video.id,
                thumbnail: video.url,
                participantName: `${video.participant.nombre} ${video.participant.apellido}`,
                alias: video.participant.alias,
                email: video.participant.email,
                instagram: video.participant.instagram, // Added Instagram
                uploadedAt: video.uploadedAt,
                format: video.format,
                instagramLikes: video.instagramLikes,
                // Metrics
                voteCount,
                pendingCount: pendingCount < 0 ? 0 : pendingCount,
                totalScoreSum, // Fixed: Now including total sum
                averageScore,
                isJudgeSelected: video.isJudgeSelected, // Added for Toggle Switch
                // Detailed Evaluations
                evaluations: video.evaluations.map(ev => ({
                    judgeName: `${ev.judge.nombre} ${ev.judge.apellido || ''}`,
                    score: ev.puntajeTotal,
                    comments: ev.observacionesGenerales || 'Sin comentarios',
                    evaluatedAt: ev.evaluatedAt, // Added evaluatedAt
                    // Needed for UI enhanced details
                    criterionScores: ev.criterionScores.map(cs => ({
                        name: cs.criterion.nombre,
                        weight: cs.criterion.peso,
                        score: cs.puntaje
                    })).sort((a, b) => a.name.localeCompare(b.name))
                }))
            };
        });
        // Sort by Average Score Descending
        results.sort((a, b) => b.averageScore - a.averageScore);
        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error('Admin results error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
ROUTE_EOF
# 2. Update Page to display instagram field
cat << 'PAGE_EOF' > app/admin/resultados/page.tsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronRight, Search, FileVideo, UserCheck, Calculator, Instagram } from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import Input from '@/components/ui/Input';
interface CriterionDetail {
    name: string;
    weight: number;
    score: number;
}
interface EvaluationDetail {
    judgeName: string;
    score: number;
    comments: string;
    evaluatedAt: string;
    criterionScores: CriterionDetail[];
}
interface ResultRow {
    id: string;
    thumbnail: string | null;
    participantName: string;
    alias: string;
    email: string;
    instagram: string; // Added field
    uploadedAt: string;
    format: string;
    instagramLikes: number;
    voteCount: number;
    pendingCount: number;
    totalScoreSum: number;
    averageScore: number;
    evaluations: EvaluationDetail[];
    isJudgeSelected: boolean;
}
export default function AdminResultsPage() {
    const [results, setResults] = useState<ResultRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    useEffect(() => {
        fetchResults();
    }, []);
    const fetchResults = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get('/api/admin/results', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setResults(res.data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRows(newSet);
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
    const formatDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMins = Math.abs(differenceInMinutes(endDate, startDate));
        const diffHours = Math.abs(differenceInHours(endDate, startDate));
        const diffDays = Math.abs(differenceInDays(endDate, startDate));
        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
        return `${diffMins} min`;
    };
    const filteredResults = results.filter(r =>
        r.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (loading) return <div className="text-center p-10 text-gray-500">Cargando resultados...</div>;
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Tablero de Control de Resultados</h1>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                        placeholder="Buscar participante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-4 text-center w-20">Jueces</th>
                                <th className="px-6 py-4">Identificación</th>
                                <th className="px-6 py-4">Fechas</th>
                                <th className="px-6 py-4 text-center">Tiempo</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center text-pink-600">Likes</th>
                                <th className="px-6 py-4 text-center text-orange-600">Pendientes</th>
                                <th className="px-6 py-4 text-center text-blue-600">Votos</th>
                                <th className="px-6 py-4 text-right bg-gray-100/50">Total</th>
                                <th className="px-6 py-4 text-right">Promedio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredResults.map((row) => (
                                <>
                                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => handleToggleJudge(row.id, row.isJudgeSelected, e)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${row.isJudgeSelected ? 'bg-purple-600' : 'bg-gray-200'}`}
                                                title={row.isJudgeSelected ? 'Visible para Jueces' : 'Oculto para Jueces'}
                                            >
                                                <span className={`${row.isJudgeSelected ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <FileVideo size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{row.participantName}</div>
                                                    <div className="text-xs text-brand-purple">{row.alias}</div>
                                                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Instagram size={10} />
                                                        {row.instagram}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            <div className="text-xs space-y-1">
                                                <div>
                                                    <span className="text-gray-400 font-medium">Subido:</span> <span className="font-bold text-gray-900">{format(new Date(row.uploadedAt), 'dd/MM HH:mm')}</span>
                                                </div>
                                                {row.evaluations.length > 0 && (
                                                    <div>
                                                        <span className="text-brand-purple font-medium">Evaluado:</span> <span className="font-bold text-gray-900">
                                                            {format(new Date(Math.max(...row.evaluations.map(e => new Date(e.evaluatedAt).getTime()))), 'dd/MM HH:mm')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">
                                            {row.evaluations.length > 0 ? (
                                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-bold">
                                                    {formatDuration(
                                                        row.uploadedAt,
                                                        new Date(Math.max(...row.evaluations.map(e => new Date(e.evaluatedAt).getTime()))).toISOString()
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                VALIDADO
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-pink-600">
                                                {row.instagramLikes}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.pendingCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                                                {row.pendingCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center cursor-pointer group" onClick={() => toggleRow(row.id)}>
                                            <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors">
                                                <UserCheck size={14} />
                                                <span className="font-bold">{row.voteCount}</span>
                                                {expandedRows.has(row.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                            <span className="block text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Ver detalles</span>
                                        </td>
                                        <td className="px-6 py-4 text-right bg-blue-50/30">
                                            <span className="text-gray-900 font-bold">{row.totalScoreSum ? row.totalScoreSum.toFixed(1) : '0.0'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xl font-black text-gray-900">{row.averageScore.toFixed(1)}</span>
                                        </td>
                                    </tr>
                                    {/* Expanded Details Sub-Table */}
                                    {expandedRows.has(row.id) && (
                                        <tr className="bg-gray-50 border-b border-gray-200 shadow-inner">
                                            <td colSpan={10} className="p-0">
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
                                                                        {row.evaluations[0].criterionScores.map((c, idx) => (
                                                                            <th key={idx} className="px-4 py-2 text-center border-r border-gray-600">
                                                                                <span className="text-xl font-black text-yellow-400">{c.weight}%</span>
                                                                            </th>
                                                                        ))}
                                                                        <th className="px-4 py-2 text-right"></th>
                                                                    </tr>
                                                                    {/* Row 2: Names */}
                                                                    <tr className="bg-gray-900/50 text-gray-300 text-xs">
                                                                        <th className="px-4 py-2 text-left border-r border-gray-700">Juez</th>
                                                                        {row.evaluations[0].criterionScores.map((c, idx) => (
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
                                                                            {/* Scores */}
                                                                            {ev.criterionScores.map((score, sIdx) => (
                                                                                <td key={sIdx} className="px-4 py-3 text-center text-gray-600 font-medium border-r border-gray-100 align-top pt-4">
                                                                                    {score.score.toFixed(1)}
                                                                                </td>
                                                                            ))}
                                                                            {/* Total */}
                                                                            <td className="px-4 py-3 text-right font-black text-brand-purple bg-brand-purple/5 border-l border-brand-purple/10 align-top pt-4">
                                                                                {ev.score.toFixed(1)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {/* Grand Total Row */}
                                                                    <tr className="bg-gray-100 font-black text-gray-900 border-t border-gray-300">
                                                                        <td className="px-4 py-2 text-right uppercase tracking-widest text-xs border-r border-gray-200">
                                                                            Totales:
                                                                        </td>
                                                                        {row.evaluations[0].criterionScores.map((c, idx) => (
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
                                </>
                            ))}
                            {filteredResults.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="text-center py-12 text-gray-400">
                                        No se encontraron resultados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
