import React from 'react';

interface TechnicalReportProps {
    resolution?: string | null;
    duration?: number | null;
    fps?: number | null;
    className?: string; // Permitir estilos externos
    condensed?: boolean; // Versión compacta para tarjetas
}

const TechnicalReportTable: React.FC<TechnicalReportProps> = ({ resolution, duration, fps, className = '', condensed = false }) => {

    // --- REGLAS DEL CONCURSO ---
    const EXPECTED = {
        res: "1024x1792",
        dur: "15s - 20s",
        fps: "30 fps"
    };

    // --- LÓGICA DE VALIDACIÓN ---

    // Resolución: Check exacto
    const resValue = resolution || 'N/A';
    const isResValid = resValue === '1024x1792';

    // Duración: Rango 15-20 (tolerancia 0.5s)
    const durValue = duration ? duration.toFixed(1) + 's' : 'N/A';
    const isDurValid = duration ? (duration >= 15 && duration <= 20.5) : false;

    // FPS: Aprox 30
    const fpsValue = fps ? Math.round(fps) : 'N/A';
    const isFpsValid = fps ? (Math.round(fps) === 30) : false;

    // Helper de estilos
    const getStatusClass = (isValid: boolean) => isValid ? 'text-green-600 font-bold' : 'text-red-500 font-bold';

    if (condensed) {
        return (
            <div className={`text-xs mt-3 bg-gray-50 rounded-lg p-2 ${className}`}>
                <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-1">
                    <span className="text-gray-500 font-semibold">Reporte Técnico</span>
                    {isResValid && isDurValid && isFpsValid ? (
                        <span className="bg-green-100 text-green-700 px-1.5 rounded text-[10px]">OK</span>
                    ) : (
                        <span className="bg-red-100 text-red-700 px-1.5 rounded text-[10px]">Revisar</span>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div>
                        <div className="text-gray-400 mb-0.5">RES</div>
                        <div className={getStatusClass(isResValid)}>{resValue}</div>
                    </div>
                    <div>
                        <div className="text-gray-400 mb-0.5">DUR</div>
                        <div className={getStatusClass(isDurValid)}>{durValue}</div>
                    </div>
                    <div>
                        <div className="text-gray-400 mb-0.5">FPS</div>
                        <div className={getStatusClass(isFpsValid)}>{fpsValue}</div>
                    </div>
                </div>
            </div>
        );
    }

    // Tabla Completa (Para Modal)
    return (
        <div className={`w-full overflow-hidden rounded-lg border border-gray-200 ${className}`}>
            <div className="bg-gray-100/50 p-2 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
                📋 Reporte Técnico del Video
            </div>
            <table className="w-full text-sm text-center">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold">
                    <tr>
                        <th className="py-2 px-3 text-left">Dato</th>
                        <th className="py-2 px-3">Esperado</th>
                        <th className="py-2 px-3">Recibido</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white font-mono">
                    {/* Resolución */}
                    <tr>
                        <td className="py-2 px-3 text-left font-sans font-medium text-gray-600">Resolución</td>
                        <td className="py-2 px-3 text-gray-500">{EXPECTED.res}</td>
                        <td className={`py-2 px-3 ${getStatusClass(isResValid)}`}>
                            {resValue}
                        </td>
                    </tr>
                    {/* Duración */}
                    <tr>
                        <td className="py-2 px-3 text-left font-sans font-medium text-gray-600">Duración</td>
                        <td className="py-2 px-3 text-gray-500">{EXPECTED.dur}</td>
                        <td className={`py-2 px-3 ${getStatusClass(isDurValid)}`}>
                            {durValue}
                        </td>
                    </tr>
                    {/* FPS */}
                    <tr>
                        <td className="py-2 px-3 text-left font-sans font-medium text-gray-600">FPS</td>
                        <td className="py-2 px-3 text-gray-500">{EXPECTED.fps}</td>
                        <td className={`py-2 px-3 ${getStatusClass(isFpsValid)}`}>
                            ~{fpsValue}
                        </td>
                    </tr>
                </tbody>
            </table>
            <div className="bg-gray-50 p-2 text-[10px] text-gray-400 italic text-center">
                * Valores validados automáticamente por el sistema
            </div>
        </div>
    );
};

export default TechnicalReportTable;
