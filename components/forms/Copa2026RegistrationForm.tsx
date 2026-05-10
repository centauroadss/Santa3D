'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Copa2026RegistrationFormProps {
    categoria: 'RENDER' | 'IA';
    onSuccess: () => void;
}

export default function Copa2026RegistrationForm({ categoria, onSuccess }: Copa2026RegistrationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const fotoInputRef = useRef<HTMLInputElement>(null);
    const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null>(null);
    const [fotoPerfilFile, setFotoPerfilFile] = useState<File | null>(null);

    const compInputRef = useRef<HTMLInputElement>(null);
    const [previewCompUrl, setPreviewCompUrl] = useState<string | null>(null);
    const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
    
    // Tasa y Monto
    const [tasaBcv, setTasaBcv] = useState<number>(0);
    const [montoUsd, setMontoUsd] = useState<number>(5);
    const [aplicaPago, setAplicaPago] = useState<boolean>(true);

    const [paymentInfo, setPaymentInfo] = useState({
        banco: 'Banesco',
        cedula: 'J123456789',
        telefono: '04140000000'
    });

    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        cedulaIdentidad: '',
        email: '',
        telefono: '',
        instagram: '',
        telefonoPago: '',
        cedulaPago: '',
        bancoPagoCodigo: '0102',
        montoDeclaradoBs: '',
    });

    const [checks, setChecks] = useState({
        heLeido: false,
        aceptoCesion: false
    });

    useEffect(() => {
        const fetchConfigAndRate = async () => {
            try {
                const confRes = await axios.get('/api/admin/inscripcion-config');
                if (confRes.data.config) {
                    setAplicaPago(confRes.data.config.aplica);
                    setMontoUsd(confRes.data.config.montoUsd || 5);
                }
                if (confRes.data.payment) {
                    setPaymentInfo(confRes.data.payment);
                }
                if (confRes.data.tasaBcv) {
                    setTasaBcv(confRes.data.tasaBcv);
                }
            } catch (e) {
                console.error("Failed to load initial data", e);
            }
        };
        fetchConfigAndRate();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('La foto no debe superar los 5MB');
            return;
        }
        setFotoPerfilFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewFotoUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCompChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('El comprobante no debe superar los 5MB');
            return;
        }
        setComprobanteFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewCompUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (aplicaPago && !comprobanteFile) {
            setError('Debes adjuntar el comprobante de pago móvil.');
            return;
        }

        if (!fotoPerfilFile) {
            setError('Debes adjuntar tu foto de perfil.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const formPayload = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                formPayload.append(key, value);
            });
            formPayload.append('categoria', categoria);
            formPayload.append('montoDeclaradoBs', formData.montoDeclaradoBs || (tasaBcv * montoUsd).toFixed(2));
            formPayload.append('tasaBcv', (tasaBcv || 1).toString());
            
            formPayload.append('fotoPerfilFile', fotoPerfilFile);
            if (aplicaPago && comprobanteFile) {
                formPayload.append('comprobanteFile', comprobanteFile);
                formPayload.append('bancoOrigen', formData.bancoPagoCodigo);
                formPayload.append('referencia', 'NA'); // Adjust if reference is required from user
            }

            const response = await axios.post('/api/copa2026/inscripcion', formPayload);

            if (response.data.success) {
                onSuccess();
            }
        } catch (err: any) {
            console.error('Error en registro:', err);
            setError(
                err.response?.data?.error ||
                'Error al registrarse. Por favor, revisa tus datos o los archivos adjuntos.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const montoCalculado = (tasaBcv * montoUsd).toFixed(2);

    const regexCedula = /^[VEP]-?\d{1,9}$/i;
    const regexPhone = /^(?:\+58|0)?(412|422|414|424|416|426)\d{7}$/;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexInstagram = /^@[\w.-]+$/;

    const isFormValid = 
        checks.heLeido && 
        checks.aceptoCesion && 
        fotoPerfilFile && 
        (!aplicaPago || comprobanteFile) &&
        regexCedula.test(formData.cedulaIdentidad.trim()) &&
        regexPhone.test(formData.telefono.trim()) &&
        regexEmail.test(formData.email.trim()) &&
        regexInstagram.test(formData.instagram.trim());

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-4 rounded-lg font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-brand-purple mb-6 border-b border-white/10 pb-2">1. Datos Personales</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <Input label="Nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} required placeholder="Juan" />
                    <Input label="Apellido" name="apellido" value={formData.apellido} onChange={handleInputChange} required placeholder="Pérez" />
                    <Input label="Cédula de Identidad" name="cedulaIdentidad" value={formData.cedulaIdentidad} onChange={handleInputChange} required placeholder="V-12345678" />
                    <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="juan@example.com" />
                    <Input label="Teléfono (WhatsApp)" type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} required placeholder="+584141234567 o 04141234567" />
                    <Input label="Usuario de Instagram" name="instagram" value={formData.instagram} onChange={handleInputChange} required placeholder="@juanp3d" helperText="Asegúrate de que empiece con @" />
                    
                    <div className="col-span-1 md:col-span-2 mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Foto de Perfil (Rostro claro)</label>
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${previewFotoUrl ? 'border-brand-purple bg-brand-purple/5' : 'border-gray-600 hover:border-gray-400 bg-[#1a1a1a]'}`}>
                            {previewFotoUrl ? (
                                <div className="space-y-4">
                                    <img src={previewFotoUrl} alt="Foto Perfil" className="max-h-48 mx-auto rounded-full shadow-lg border border-white/10 object-cover aspect-square" />
                                    <button 
                                        type="button" 
                                        onClick={() => { setPreviewFotoUrl(null); setFotoPerfilFile(null); }}
                                        className="text-sm text-red-400 hover:text-red-300 font-bold"
                                    >
                                        Cambiar Foto
                                    </button>
                                </div>
                            ) : (
                                <div className="cursor-pointer" onClick={() => fotoInputRef.current?.click()}>
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-300 font-medium">Haz clic para subir tu foto de perfil</p>
                                    <p className="text-gray-500 text-sm mt-1">Formatos: JPG, PNG (Max 5MB)</p>
                                    <p className="text-brand-purple text-xs mt-2 font-bold">⚠️ Debe ser un rostro de persona (no paisajes ni objetos)</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fotoInputRef} 
                                onChange={handleFotoChange} 
                                accept="image/jpeg, image/png, image/webp" 
                                className="hidden" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {aplicaPago && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/10 pb-4 gap-4">
                        <h3 className="text-xl font-bold text-green-400">2. Pago Móvil</h3>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Monto a pagar ({montoUsd} USD):</p>
                            <p className="text-2xl font-black text-white">Bs. {montoCalculado}</p>
                            <p className="text-xs text-brand-purple">Tasa BCV referencial: Bs. {tasaBcv}</p>
                        </div>
                    </div>
                    
                    <div className="bg-[#111] rounded-xl p-4 mb-6 border border-white/5 font-mono text-sm text-center text-gray-300">
                        <p>Realiza el pago a los siguientes datos:</p>
                        <p className="font-bold text-white text-lg mt-2">{paymentInfo.banco}</p>
                        <p>Teléfono: {paymentInfo.telefono}</p>
                        <p>CI/RIF: {paymentInfo.cedula}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Banco de Origen</label>
                            <select 
                                name="bancoPagoCodigo" 
                                value={formData.bancoPagoCodigo} 
                                onChange={handleInputChange} 
                                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-all"
                                required
                            >
                                <option value="0102">Banco de Venezuela (0102)</option>
                                <option value="0104">Banco Venezolano de Crédito (0104)</option>
                                <option value="0105">Banco Mercantil (0105)</option>
                                <option value="0108">Banco Provincial (0108)</option>
                                <option value="0114">Bancaribe (0114)</option>
                                <option value="0115">Banco Exterior (0115)</option>
                                <option value="0134">Banesco (0134)</option>
                                <option value="0151">BFC Banco Fondo Común (0151)</option>
                                <option value="0156">100% Banco (0156)</option>
                                <option value="0172">Bancamiga (0172)</option>
                                <option value="0175">Banco Bicentenario (0175)</option>
                                <option value="0191">BNC Nacional de Crédito (0191)</option>
                            </select>
                        </div>
                        <Input label="Teléfono Emisor" name="telefonoPago" value={formData.telefonoPago} onChange={handleInputChange} required placeholder="04121234567" helperText="Desde donde se hizo el pago" />
                        <Input label="Cédula Emisor" name="cedulaPago" value={formData.cedulaPago} onChange={handleInputChange} required placeholder="V-12345678" />
                        
                        <div className="col-span-1 md:col-span-2 mt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Comprobante de Pago (Capture)</label>
                            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${previewCompUrl ? 'border-brand-purple bg-brand-purple/5' : 'border-gray-600 hover:border-gray-400 bg-[#1a1a1a]'}`}>
                                {previewCompUrl ? (
                                    <div className="space-y-4">
                                        <img src={previewCompUrl} alt="Comprobante" className="max-h-64 mx-auto rounded-lg shadow-lg border border-white/10" />
                                        <button 
                                            type="button" 
                                            onClick={() => { setPreviewCompUrl(null); setComprobanteFile(null); }}
                                            className="text-sm text-red-400 hover:text-red-300 font-bold"
                                        >
                                            Cambiar Comprobante
                                        </button>
                                    </div>
                                ) : (
                                    <div className="cursor-pointer" onClick={() => compInputRef.current?.click()}>
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-300 font-medium">Haz clic para subir tu comprobante</p>
                                        <p className="text-gray-500 text-sm mt-1">Formatos: JPG, PNG (Max 5MB)</p>
                                        <p className="text-brand-purple text-xs mt-2 font-bold">⚠️ Asegúrate de que el Monto y Fecha sean legibles</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    ref={compInputRef} 
                                    onChange={handleCompChange} 
                                    accept="image/jpeg, image/png, image/webp" 
                                    className="hidden" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-1">
                        <input 
                            type="checkbox" 
                            checked={checks.heLeido}
                            onChange={(e) => setChecks({...checks, heLeido: e.target.checked})}
                            className="w-5 h-5 rounded border-gray-600 text-brand-purple focus:ring-brand-purple bg-[#1a1a1a]"
                        />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors">He leído y acepto las bases del concurso Copa Centauro 2026.</p>
                    </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-1">
                        <input 
                            type="checkbox" 
                            checked={checks.aceptoCesion}
                            onChange={(e) => setChecks({...checks, aceptoCesion: e.target.checked})}
                            className="w-5 h-5 rounded border-gray-600 text-brand-purple focus:ring-brand-purple bg-[#1a1a1a]"
                        />
                    </div>
                    <div>
                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors">Acepto la cesión de derechos sobre mi obra y autorizo su uso y reproducción por parte de Centauro.</p>
                    </div>
                </label>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={tasaBcv === 0 || !isFormValid}>
                {isSubmitting ? 'Verificando Comprobante...' : (tasaBcv === 0 ? 'Cargando datos...' : 'Finalizar Inscripción')}
            </Button>
            
            <p className="text-center text-xs text-gray-500 mt-4">
                Al finalizar, nuestro sistema validará tu pago y te enviaremos por email el acceso exclusivo para subir tu obra.
            </p>
        </form>
    );
}
