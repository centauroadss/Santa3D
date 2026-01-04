'use client';

import { useState } from 'react';
import Script from 'next/script';

export default function InstagramSetup() {
    const [appId, setAppId] = useState('1197637831784065');
    const [sdkReady, setSdkReady] = useState(false);
    const [status, setStatus] = useState('Esperando inicializar...');
    const [token, setToken] = useState('');
    const [igId, setIgId] = useState('');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const initSdk = () => {
        if (typeof window !== 'undefined' && (window as any).FB) {
            try {
                // @ts-ignore
                window.FB.init({
                    appId: appId.trim(),
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                setSdkReady(true);
                setStatus('SDK Inicializado. Listo para conectar.');
                addLog(`✅ SDK reinicializado con App ID: ${appId}`);
            } catch (e: any) {
                addLog(`❌ Error iniciando SDK: ${e.message}`);
            }
        } else {
            addLog('⚠️ Error: El script de Facebook no ha cargado aún.');
        }
    };

    const login = () => {
        if (!sdkReady) {
            initSdk();
        }
        addLog('Iniciando login...');

        // @ts-ignore
        window.FB.login((response) => {
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                setToken(accessToken);
                addLog('✅ Token obtenido exitosamente!');
                fetchInstagramId(accessToken);
            } else {
                addLog('❌ Login cancelado o fallido.');
                console.log('FB Login Response:', response);
            }
        }, { scope: 'instagram_basic,instagram_manage_insights,instagram_manage_comments,pages_show_list,pages_read_engagement' });
    };

    const fetchInstagramId = async (accessToken: string) => {
        try {
            addLog('Buscando Fan Pages vinculadas...'); // 1. Get Pages
            const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
            const pagesData = await pagesRes.json();

            // SHOW TOKEN ALWAYS (For Debugging)
            if (!pagesData.data || pagesData.data.length === 0) {
                addLog('❌ ERROR: No se encontraron Fan Pages.');
                addLog('⚠️ Pero aquí tienes el token para que el programador investigue:');
                // The token key is already set in the parent login() function, 
                // but we make sure the UI doesn't hide it.
                if (pagesData.error) addLog(`API Error: ${pagesData.error.message}`);
                // Don't return here, let the UI show the token
            } else {
                addLog(`Encontradas ${pagesData.data.length} páginas. Buscando cuenta de Instagram...`);
                // ... rest of logic
                for (const page of pagesData.data) {
                    const igRes = await fetch(`https://graph.facebook.com/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
                    const igData = await igRes.json();

                    if (igData.instagram_business_account) {
                        setIgId(igData.instagram_business_account.id);
                        addLog(`✅ ¡ÉXITO! ID Encontrado: ${igData.instagram_business_account.id}`);
                        return;
                    }
                }
                addLog('⚠️ Alerta: Tienes Fan Pages, pero sin Instagram vinculado.');
            }
        } catch (e: any) {
            addLog('Error fetching data: ' + e.message);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans max-w-3xl mx-auto border-4 border-black mt-4">
            <Script src="https://connect.facebook.net/en_US/sdk.js" />

            <h1 className="text-3xl font-black mb-8 text-black border-b-4 border-black pb-4">
                🛠️ CONFIGURACIÓN INSTAGRAM
            </h1>

            {/* CAJA PASO 1 */}
            <div className="mb-8 p-6 border-4 border-black rounded-xl bg-gray-50">
                <label className="block text-xl font-bold mb-4 text-black">
                    1. APP ID (Pegar aquí):
                </label>

                <div className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        className="w-full p-4 border-4 border-black text-2xl font-mono text-black bg-white focus:bg-yellow-100 placeholder-gray-500"
                        placeholder="Ej: 119763..."
                    />

                    <div className="flex gap-4">
                        <button
                            onClick={() => setAppId('')}
                            className="bg-red-100 text-red-900 border-2 border-red-900 px-4 py-2 font-bold hover:bg-red-200"
                        >
                            BORRAR TODO
                        </button>

                        <button
                            onClick={initSdk}
                            className="flex-1 bg-black text-white text-xl px-6 py-3 font-bold hover:bg-gray-800 border-4 border-black"
                        >
                            GUARDAR E INICIALIZAR SDK
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-6 text-xl p-4 bg-gray-100 border-l-8 border-blue-600">
                Estado: <span className="font-bold text-blue-900">{status}</span>
            </div>

            {/* BOTON GIGANTE PASO 2 */}
            {!token && (
                <button
                    onClick={login}
                    className={`block w-full text-2xl font-black py-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all
                    ${sdkReady
                            ? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    {sdkReady ? 'PASO 2: CONECTAR CON FACEBOOK →' : '(Primero inicializa el SDK arriba)'}
                </button>
            )}

            {/* RESULTADOS */}
            {token && (
                <div className="mt-8 space-y-6">
                    <div className="p-6 bg-green-50 border-4 border-green-600 rounded-xl">
                        <h3 className="font-black text-xl text-green-900 mb-2">✅ TOKEN DE ACCESO:</h3>
                        <textarea
                            readOnly
                            value={token}
                            className="w-full h-32 p-4 text-sm font-mono border-2 border-green-800 bg-white text-black"
                        />
                        <p className="text-green-800 font-bold mt-2">COPIA ESTO AL PORTAPAPELES</p>
                    </div>

                    <div className="p-6 bg-purple-50 border-4 border-purple-600 rounded-xl">
                        <h3 className="font-black text-xl text-purple-900 mb-2">✅ INSTAGRAM USER ID:</h3>
                        {igId ? (
                            <div className="text-4xl font-mono font-black text-center p-6 bg-white border-4 border-purple-900 text-black select-all">
                                {igId}
                            </div>
                        ) : (
                            <p className="text-xl italic animate-pulse text-purple-800 font-bold">🔍 Buscando ID...</p>
                        )}
                    </div>
                </div>
            )}

            {/* LOGS */}
            <div className="mt-8">
                <h4 className="font-black text-black mb-2 uppercase">Historial de Logs:</h4>
                <div className="bg-black text-yellow-400 p-4 rounded-xl font-mono text-sm h-64 overflow-auto border-4 border-gray-600">
                    {logs.length === 0 && <span className="text-gray-500">Esperando acciones...</span>}
                    {logs.map((L, i) => <div key={i} className="mb-1 border-b border-gray-800 pb-1">{L}</div>)}
                </div>
            </div>
        </div>
    );
}
