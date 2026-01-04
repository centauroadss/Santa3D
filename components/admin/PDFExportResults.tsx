import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';

interface PDFExportProps {
    data: any[];
}

export default function PDFExportResults({ data }: PDFExportProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = (mode: 'SUMMARY' | 'DETAIL') => {
        setIsGenerating(true);
        setIsMenuOpen(false);

        // Allow UI to update (show loading) before freezing
        setTimeout(() => {
            try {
                const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better table fit
                const pageWidth = doc.internal.pageSize.width;

                // Header
                doc.setFontSize(18);
                doc.setTextColor(40, 40, 40);
                doc.text('Reporte de Resultados - Santa 3D 2025', 14, 15);

                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 22);
                doc.text(`Modo: ${mode === 'SUMMARY' ? 'RESUMEN EJECUTIVO' : 'REPORTE DETALLADO'}`, 14, 27);

                // [DYNAMIC COLUMN LOGIC]
                // 1. Calculate Max Criteria to define total columns needed
                let maxCriteria = 0;
                let criteriaNames: string[] = [];

                if (mode === 'DETAIL') {
                    data.forEach(row => {
                        if (row.evaluations && row.evaluations.length > 0) {
                            row.evaluations.forEach((ev: any) => {
                                if (ev.criterionScores && ev.criterionScores.length > maxCriteria) {
                                    maxCriteria = ev.criterionScores.length;
                                    criteriaNames = ev.criterionScores.map((c: any) => c.name);
                                }
                            });
                        }
                    });
                }

                // Fallback if no criteria found but Detail mode requested (assume 5 as per user feedback)
                if (mode === 'DETAIL' && maxCriteria === 0) {
                    maxCriteria = 5;
                    criteriaNames = ['Criterio 1', 'Criterio 2', 'Criterio 3', 'Criterio 4', 'Criterio 5'];
                }

                // 2. Define Table Structure
                // Main Table Base: 10 Columns (Matches Web Layout Enhanced)
                // Sub Table Needs: Indent(1) + Judge(1) + Date(1) + Comment(1) + Criteria(N) + Total(1) = 5 + N
                const baseMainCols = 10;
                // Sub Table Needs: Indent(1) + Judge(1) + Date(1) + Comment(1) + Criteria(N) + Total(1) = 5 + N
                const requiredSubCols = mode === 'DETAIL' ? (5 + maxCriteria) : 0;
                const totalCols = Math.max(baseMainCols, requiredSubCols);

                // Build Header
                const headRow = ['#', 'Participante', 'Email', 'Instagram', 'Fechas', 'Specs (Ref)', 'Specs', 'Likes Cierre', 'Votos', 'Promedio'];
                // Pad header with empty strings if more columns needed
                while (headRow.length < totalCols) {
                    headRow.push('');
                }

                const tableBody: any[] = [];

                data.forEach((row, index) => {
                    const position = index + 1;
                    const participant = `${row.participantName}\n(${row.alias})`;
                    const techSpecs = `${row.resolution || '-'}\n${row.fps}fps | ${row.duration}s`;
                    const score = row.averageScore ? row.averageScore.toFixed(1) : '-';
                    const votes = row.voteCount || 0;
                    const closingLikes = row.closingLikes || 0;

                    // Fechas Logic (Main Row)
                    const uploadedDate = row.uploadedAt ? format(new Date(row.uploadedAt), 'dd/MM HH:mm') : '-';
                    // We don't have 'lastEvaluationDate' easily available on main row object unless calculated
                    // but user wants TWO dates. We'll use Uploaded as primary, and stick with just that if eval not avail.
                    // Actually, let's stack them if possible or just label "Inscripción".
                    // Per request: "las dos Fechas que aparecen en el templete de Resultados" -> Inscripción + Evaluación
                    // Let's assume we calculate max eval date from evaluations array
                    let lastEvalDate = '-';
                    if (row.evaluations && row.evaluations.length > 0) {
                        const dates = row.evaluations.map((e: any) => new Date(e.evaluatedAt).getTime());
                        lastEvalDate = format(new Date(Math.max(...dates)), 'dd/MM HH:mm');
                    }
                    const fechasCell = `Insc: ${uploadedDate}\nEval: ${lastEvalDate}`;

                    // Specs Ref
                    const specsRef = `1024x1792\n30 fps+\n15-20s`;

                    // Specs Real (2 decimals duration)
                    const durationVal = typeof row.duration === 'number' ? row.duration.toFixed(2) : row.duration;
                    const specsReal = `${row.resolution || '-'}\n${row.fps}fps\n${durationVal}s`;

                    // Main Row Data
                    const mainRow = [
                        position,
                        participant,
                        row.email || '-',
                        row.instagram || '-',
                        fechasCell, // Col 5: Fechas Stacked
                        specsRef,   // Col 6: Specs Ref
                        specsReal,  // Col 7: Specs Real
                        closingLikes,
                        votes,
                        score
                    ];

                    // Pad Main Row to match totalCols
                    while (mainRow.length < totalCols) {
                        mainRow.push('');
                    }

                    tableBody.push(mainRow);

                    // DETAIL MODE: Add Sub-tables
                    if (mode === 'DETAIL' && row.evaluations && row.evaluations.length > 0) {
                        // 1. Sub-Header Row
                        // Col 0: Empty
                        // Col 1: JUEZ
                        // Col 2: COMENTARIOS
                        // Col 3..N: CRITERIA
                        // Col Last: TOTAL

                        const subHeaderRow: any[] = [
                            { content: '', styles: { fillColor: [240, 240, 240] } },
                            { content: 'JUEZ', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: 50, fontSize: 8 } },
                            { content: 'FECHAS', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: 50, fontSize: 8 } }, // ADDED
                            { content: 'COMENTARIOS', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: 50, fontSize: 8 } },
                        ];

                        // Add Criteria Headers
                        criteriaNames.forEach(name => {
                            subHeaderRow.push({ content: name.toUpperCase(), styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: 50, halign: 'center', fontSize: 7 } });
                        });

                        // Add Total Header
                        subHeaderRow.push({ content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: 50, halign: 'right', fontSize: 8 } });

                        // Fill any remaining gaps if Main Table is strictly wider
                        while (subHeaderRow.length < totalCols) {
                            subHeaderRow.splice(subHeaderRow.length - 1, 0, { content: '-', styles: { fillColor: [240, 240, 240], fontSize: 8 } });
                        }

                        tableBody.push(subHeaderRow);

                        // 2. Evaluation Rows
                        row.evaluations.forEach((ev: any) => {
                            const judge = ev.judgeName || ev.judge?.name || 'Juez';
                            let comments = ev.comments || ev.observacionesGenerales || 'NO';
                            if (comments === 'Sin comentarios') comments = 'NO';

                            const scores = ev.criterionScores?.map((c: any) => c.score.toFixed(1)) || [];
                            // Fix: Ensure we have scores for all criteria columns, pad with '-' if missing
                            while (scores.length < maxCriteria) {
                                scores.push('-');
                            }

                            const total = (ev.score || ev.puntajeTotal || 0).toFixed(1);

                            // Format Date (Dual: Uploaded + Evaluated)
                            // User Request: "las dos fechas que aparecen en la columna FECHAS del modulo de Votacion jueces... asegúrate de que esta vez ambas fechas aparezcan"
                            // In Judge Module: Subido (Video Upload) + Evaluado (Evaluation Date)
                            const uploadedAtVideo = row.uploadedAt ? format(new Date(row.uploadedAt), 'dd/MM HH:mm') : '-';
                            const evaluatedAt = ev.evaluatedAt ? format(new Date(ev.evaluatedAt), 'dd/MM HH:mm') : '-';
                            const dateCell = `Sub: ${uploadedAtVideo}\nEval: ${evaluatedAt}`;

                            const evalRow: any[] = [
                                { content: '', styles: { fillColor: [255, 255, 255] } }, // Indent
                                { content: judge, styles: { fontSize: 8, textColor: 80 } },
                                { content: dateCell, styles: { fontSize: 7, textColor: 80 } }, // Dual Date
                                { content: comments, styles: { fontSize: 7, fontStyle: comments !== 'NO' ? 'italic' : 'normal', textColor: comments !== 'NO' ? [102, 51, 153] : 150 } },
                            ];

                            scores.forEach((s: string) => {
                                evalRow.push({ content: s, styles: { halign: 'center', fontSize: 8, textColor: 80 } });
                            });

                            evalRow.push({ content: total, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [102, 51, 153] } });

                            // Fill gaps
                            while (evalRow.length < totalCols) {
                                evalRow.splice(evalRow.length - 1, 0, { content: '', styles: {} });
                            }

                            tableBody.push(evalRow);
                        });

                        // 3. Spacer Row
                        tableBody.push([{ content: '', colSpan: totalCols, styles: { cellPadding: 1, fillColor: [255, 255, 255] } }]);
                    }
                });

                autoTable(doc, {
                    startY: 35,
                    head: [headRow],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [102, 51, 153], // Brand Purple
                        textColor: 255,
                        fontSize: 10,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 10 },
                        1: { cellWidth: 50 }, // Participant / Judge
                        2: { cellWidth: 35 }, // Email / Sub-Fechas
                        3: { cellWidth: 50 }, // Instagram / Comentarios (Expanded for readability)
                        4: { valign: 'middle', halign: 'center', cellWidth: 28, fontSize: 7 }, // Fechas (Main) / Crit 1
                        5: { valign: 'middle', halign: 'center', cellWidth: 20, fontSize: 7, textColor: 100 }, // Specs Ref / Crit 2
                        6: { valign: 'middle', halign: 'center', cellWidth: 20, fontSize: 8 }, // Specs Real / Crit 3
                        7: { valign: 'middle', halign: 'center', cellWidth: 22 }, // Likes Cierre / Crit 4
                        8: { valign: 'middle', halign: 'center', cellWidth: 18 }, // Votos / Crit 5
                        9: { valign: 'middle', halign: 'right', cellWidth: 20, fontStyle: 'bold', fontSize: 12, textColor: [102, 51, 153] }, // Promedio / Total
                    },
                    styles: {
                        fontSize: 9,
                        cellPadding: 3,
                        overflow: 'linebreak'
                    }
                });

                doc.save(`Santa3D_Resultados_${mode}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);

            } catch (error) {
                console.error("PDF Error", error);
                alert("Error generando el PDF. Intente de nuevo.");
            } finally {
                setIsGenerating(false);
            }
        }, 100);
    };

    return (
        <div className="relative inline-block text-left z-20">
            <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                disabled={isGenerating}
                className={`px-4 py-2 text-sm font-bold border rounded-md shadow-sm transition-all flex items-center justify-center gap-2 text-white bg-blue-600 border-blue-700 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait min-w-[140px]`}
            >
                {isGenerating ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                    <FileDown size={16} />
                )}
                PDF
                <ChevronDown size={16} className={`ml-1 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN MENU */}
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        <button
                            onClick={() => generatePDF('SUMMARY')}
                            className="group flex w-full items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className="font-bold flex items-center gap-2 text-gray-900">
                                    RESUMEN EJECUTIVO
                                </span>
                                <span className="text-xs text-gray-500">Tabla general. Ideal para compartir.</span>
                            </div>
                        </button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button
                            onClick={() => generatePDF('DETAIL')}
                            className="group flex w-full items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                        >
                            <div className="flex flex-col items-start gap-1">
                                <span className="font-bold flex items-center gap-2 text-blue-600">
                                    REPORTE DETALLADO
                                </span>
                                <span className="text-xs text-gray-500">Incluye desglose por criterios y comentarios.</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Overlay to close menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
            )}
        </div>
    );
}
