'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, ListChecks, UserCog, ShieldCheck, Image, FileVideo, Lock } from 'lucide-react';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    useEffect(() => {
        if (pathname === '/admin/login') {
            setAuthorized(true);
            return;
        }
        const token = localStorage.getItem('admin_token');
        if (!token) {
            console.warn('⚠️ Layout: No admin_token found. Showing unauthorized screen.');
        } else {
            setAuthorized(true);
        }
    }, [pathname, router]);
    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        document.cookie = 'admin_token=; Max-Age=0; path=/;';
        router.push('/admin/login');
    };
    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
                <div className="max-w-md p-8 bg-white rounded-xl shadow-2xl text-center">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso No Detectado</h1>
                    <button
                        onClick={() => router.push('/admin/login')}
                        className="w-full py-3 bg-brand-purple text-white font-bold rounded-lg hover:bg-opacity-90 transition-all mt-4"
                    >
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }
    if (pathname === '/admin/login') return <>{children}</>;
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
                <div className="mb-8">
                    <h2 className="text-xl font-black text-brand-purple tracking-tighter">SANTA 3D <span className="text-gray-400 font-normal">| Admin</span></h2>
                </div>
                <nav className="flex-grow space-y-2">
                    <Link href="/admin/resultados" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/resultados' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <LayoutDashboard size={18} />
                        Resultados
                    </Link>
                    <Link href="/admin/jueces" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/jueces' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <Users size={18} />
                        Perfil Jueces
                    </Link>
                    <Link href="/admin/criterios" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/criterios' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <ListChecks size={18} />
                        Criterios
                    </Link>
                    <Link href="/admin/perfil" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/perfil' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <UserCog size={18} />
                        Mi Cuenta
                    </Link>
                    <Link href="/admin/videos" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/videos' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <FileVideo size={18} />
                        Videos
                    </Link>
                    <Link href="/admin/instagram" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/instagram' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <Image size={18} />
                        Curaduría IG
                    </Link>
                    <Link href="/admin/instagram-config" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/instagram-config' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <Image size={18} />
                        Config. Instagram
                    </Link>
                    <Link href="/admin/likes-closing" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/likes-closing' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <ShieldCheck size={18} />
                        Likes Cierre
                    </Link>
                    <Link href="/admin/seguridad" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm ${pathname === '/admin/seguridad' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                        <ShieldCheck size={18} />
                        Seguridad
                    </Link>
                </nav>
                <div className="mt-auto">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-time-red/10 font-bold text-sm transition-colors w-full">
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
            <main className="flex-grow p-6 md:p-10 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
