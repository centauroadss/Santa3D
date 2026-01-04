'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';

export default function TestPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-10">
            <h1 className="text-4xl font-bold text-brand-purple mb-4">PÁGINA DE PRUEBA DE DIAGNÓSTICO</h1>
            <p className="text-xl mb-8">Si puedes leer esto, NO hay redirección en esta ruta.</p>

            <div className="p-6 bg-gray-800 rounded-xl">
                <h2 className="text-2xl font-bold mb-4">Estado del Sistema:</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Ruta: /admin/prueba</li>
                    <li>Status: 🟢 ONLINE</li>
                    <li>Redirección: 🔴 INACTIVA</li>
                </ul>
            </div>

            <div className="mt-8">
                <a href="/admin/jueces" className="text-blue-400 hover:text-blue-300 underline">
                    Intentar ir a Perfil Jueces (Ruta Original)
                </a>
            </div>
        </div>
    );
}
