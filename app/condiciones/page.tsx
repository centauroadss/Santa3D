// app/condiciones/page.tsx
import React from 'react';

export default function TerminosPage() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-4xl">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
                <h1 className="text-4xl md:text-5xl font-black mb-8 text-center uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                    Términos y Condiciones
                </h1>

                <div className="space-y-8 text-gray-300 leading-relaxed text-lg">
                    <p className="font-medium text-white text-xl border-b border-white/10 pb-4">
                        Bienvenido al Concurso "Santa 3D Venezolano" organizado por Centauro ADS.
                    </p>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-red-500">1.</span> Objetivo del Concurso
                        </h2>
                        <p>
                            Crear una animación 3D original de un Santa Claus con temática venezolana,
                            diseñada específicamente para ser proyectada en la pantalla LED vertical
                            de Chacao.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-red-500">2.</span> Requisitos de Participación
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 marker:text-red-500">
                            <li>Ser mayor de 18 años.</li>
                            <li>Residir en Venezuela o ser venezolano en el extranjero.</li>
                            <li>La obra debe ser 100% original.</li>
                            <li>Seguir la cuenta de Instagram @centauroads.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-red-500">3.</span> Cancelación y Modificaciones
                        </h2>
                        <p>
                            Centauro ADS se reserva el derecho de modificar los plazos o condiciones
                            del concurso por razones de fuerza mayor, notificándolo a través de sus
                            redes oficiales.
                        </p>
                    </section>

                    <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-xl mt-12 text-center">
                        <h3 className="text-red-400 font-bold mb-2 uppercase tracking-wide">¿Tienes dudas?</h3>
                        <p className="text-sm text-gray-400">
                            Escríbenos directamente a:
                            <br />
                            <a href="mailto:mercadeo@centauroads.com" className="text-white hover:text-red-400 font-bold mt-2 inline-block text-lg transition-colors">
                                mercadeo@centauroads.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
