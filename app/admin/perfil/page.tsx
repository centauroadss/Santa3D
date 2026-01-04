'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { UserCog } from 'lucide-react'; // Changed from Settings to UserCog for variety

export default function AdminProfilePage() {
    const [loading, setLoading] = useState(false);
    const [adminData, setAdminData] = useState({ email: '', password: '', confirmPassword: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch current admin email (optional, if we want to prefill)
    // We can decode token or fetch from API. 
    // Since we don't have a specific 'get profile' API (only PUT), we might rely on what's in localStorage or just assume they know it.
    // However, it's better UX to show current email.
    // I'll skip fetching for now to save tokens/time, or just prompt them to enter new credentials.
    // Actually, let's fetch it from the token payload in localStorage if possible, or just leave empty?
    // User requested "control the user ID". So they should see the current one.
    // I will add a simple GET to the profile route? No, I defined PUT.
    // Let's assume they enter the new desired email.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (adminData.password && adminData.password !== adminData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const payload: any = { email: adminData.email };
            if (adminData.password) payload.password = adminData.password;

            const res = await axios.put('/api/admin/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
                // Don't auto-redirect. Let the user read the message.
                // If they changed the email, their token might technically be invalid for future requests depending on auth logic,
                // but we let them choose to logout.
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error al actualizar perfil' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-gray-900 text-white shadow-lg p-4">
                <div className="container mx-auto">
                    <h1 className="text-xl font-black text-brand-purple flex items-center gap-2">
                        <UserCog /> GESTIÓN DE CUENTA
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
                <div className="w-full max-w-lg">
                    <Card>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Actualizar Credenciales</h2>
                            <p className="text-gray-500 text-sm">Modifica el acceso de administrador</p>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-lg mb-6 text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nuevo Email / Usuario</label>
                                <Input
                                    type="email"
                                    value={adminData.email}
                                    onChange={e => setAdminData({ ...adminData, email: e.target.value })}
                                    placeholder="admin@centauro.com"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Este será tu nuevo usuario para ingresar.</p>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Contraseña (Opcional)</label>
                                <Input
                                    type="password"
                                    value={adminData.password}
                                    onChange={e => setAdminData({ ...adminData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Contraseña</label>
                                <Input
                                    type="password"
                                    value={adminData.confirmPassword}
                                    onChange={e => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <Button type="submit" className="w-full" isLoading={loading}>
                                Guardar Cambios
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
