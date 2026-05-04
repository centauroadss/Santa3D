'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ConfirmacionPage() {
    const [email, setEmail] = useState('');
    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState('');
    const [monto, setMonto] = useState('');
    
    const [reenviando, setReenviando] = useState(false);
    const [mensaje, setMensaje] = useState<{tipo: 'success'|'error', texto: string} | null>(null);

    useEffect(() => {
        // Cargar datos de sessionStorage
        setEmail(sessionStorage.getItem('copa2026_confirm_email') || '');
        setNombre(sessionStorage.getItem('copa2026_confirm_nombre') || '');
        setCategoria(sessionStorage.getItem('copa2026_confirm_categoria') || '');
        setMonto(sessionStorage.getItem('copa2026_confirm_monto') || '');
    }, []);

    const handleReenviar = async () => {
        if (!email) return;

        // Limitar a 1 reenvío cada 5 minutos
        const lastSent = sessionStorage.getItem('copa2026_last_resend');
        if (lastSent) {
            const timeDiff = Date.now() - parseInt(lastSent, 10);
            if (timeDiff < 5 * 60 * 1000) {
                const minutosRestantes = Math.ceil((5 * 60 * 1000 - timeDiff) / 60000);
                setMensaje({ tipo: 'error', texto: `Por favor espera ${minutosRestantes} minutos antes de reenviar.` });
                return;
            }
        }

        setReenviando(true);
        setMensaje(null);

        try {
            const response = await fetch('/api/copa2026/inscripcion/reenviar-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al reenviar el correo');
            }

            sessionStorage.setItem('copa2026_last_resend', Date.now().toString());
            setMensaje({ tipo: 'success', texto: 'Correo reenviado exitosamente. Revisa tu bandeja de entrada o spam.' });
        } catch (error: any) {
            setMensaje({ tipo: 'error', texto: error.message });
        } finally {
            setReenviando(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white py-12 px-4 md:px-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full bg-[#0a0a0a] border border-[#222] p-8 md:p-12 rounded-3xl shadow-2xl text-center">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    ✓
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-4">¡Inscripción Exitosa!</h1>
                <p className="text-neutral-400 mb-8 text-lg">
                    Hola {nombre}, hemos validado tu pago (Bs. {monto}) y registrado tu inscripción en la categoría <strong>{categoria}</strong>.
                </p>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8 text-left">
                    <h3 className="font-semibold text-white mb-2">Pasos Siguientes:</h3>
                    <ul className="text-neutral-400 space-y-2 list-disc list-inside">
                        <li>Hemos enviado un correo a <strong>{email}</strong> con tu link único para subir el video.</li>
                        <li>El link es privado y de un solo uso para la carga de tu proyecto final.</li>
                        <li>Tienes hasta el 05 de Junio de 2026 para enviar tu video.</li>
                    </ul>
                </div>

                <div className="space-y-4">
                    {mensaje && (
                        <div className={`p-4 rounded-lg text-sm ${mensaje.tipo === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                            {mensaje.texto}
                        </div>
                    )}

                    <button 
                        onClick={handleReenviar} 
                        disabled={reenviando}
                        className="w-full px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full font-semibold transition-all disabled:opacity-50"
                    >
                        {reenviando ? 'Reenviando...' : 'Reenviar correo de confirmación'}
                    </button>

                    <Link 
                        href="/copa2026"
                        className="block w-full px-6 py-4 border border-neutral-700 text-neutral-300 rounded-full font-semibold transition-all hover:bg-neutral-800"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
