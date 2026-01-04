'use client';
import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { KeyRound, Gift } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
interface Judge {
    id: string;
    nombre: string;
    apellido: string;
    profesion: string;
    biografia: string;
    email: string;
    telefono: string;
    instagram: string;
    fotoUrl: string;
}
interface Props {
    judges: Judge[];
    token: string;
    onRefresh: () => void;
}
export default function JudgesProfileTable({ judges, token, onRefresh }: Props) {
    const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    // Handlers
    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este juez?')) return;
        try {
            await axios.delete(`/api/judges/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onRefresh();
        } catch (e: any) {
            const msg = e.response?.data?.error || e.message || 'Error desconocido';
            alert(`Error al eliminar: ${msg}`);
        }
    };
    const handleResetPassword = async (id: string, nombre: string) => {
        if (!confirm(`¿Estás seguro de restablecer la contraseña para ${nombre}? Se cambiará a "Centauro2025!".`)) return;
        try {
            const res = await axios.post(`/api/judges/${id}/reset-password`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message || 'Contraseña restablecida correctamente');
        } catch (e: any) {
            const msg = e.response?.data?.error || e.message || 'Error desconocido';
            alert(`Error al restablecer: ${msg}`);
        }
    };
    const handleSendWelcomeEmail = async (id: string, email: string) => {
        if (!confirm(`¿Enviar correo de bienvenida a ${email}?`)) return;
        try {
            await axios.post(`/api/judges/${id}/send-welcome`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Correo enviado exitosamente a ${email}`);
        } catch (e: any) {
            const msg = e.response?.data?.error || e.message || 'Error desconocido';
            alert(`Error al enviar correo: ${msg}`);
        }
    };

    const handleSendThankYou = async (judge: Judge) => {
        if (!confirm(`¿Enviar Carta de Agradecimiento Navideña a ${judge.nombre} (${judge.email}) con su reporte adjunto?`)) return;

        try {
            const loadingMsg = document.createElement('div');
            loadingMsg.id = 'loading-pdf-mail';
            loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:10px;z-index:9999;';
            loadingMsg.innerText = '🎄 Generando PDF y Enviando Regalo...';
            document.body.appendChild(loadingMsg);

            // 1. Fetch Judge Data
            const res = await axios.get(`/api/admin/judges/${judge.id}/evaluations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.data.success) throw new Error('Error fetching data');
            const videos = res.data.data.videos || [];

            // 2. Generate PDF
            const doc = new jsPDF({ orientation: 'landscape' });

            // Header
            doc.setFillColor(102, 51, 153); // Brand Purple
            doc.rect(0, 0, 210, 25, 'F'); // Increased height
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('REPORTE DE EVALUACIONES - SANTA 3D', 14, 12);

            doc.setFontSize(12);
            doc.text(`Juez: ${judge.nombre.toUpperCase()} ${judge.apellido.toUpperCase()}`, 14, 20); // Name prominently in header

            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50); // Reset for body
            doc.setFont('helvetica', 'normal');
            doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 33);

            // Dynamic Columns Logic (Match EvaluatedVideosTable)
            // Extract all unique criterion names from first video (assuming consistent criteria)
            let criteriaNames: string[] = [];
            if (videos.length > 0 && videos[0].evaluation?.criterionScores) {
                // Sort appropriately if needed
                criteriaNames = videos[0].evaluation.criterionScores
                    .map((cs: any) => cs.criterion.nombre)
                    .sort();
            }

            const headRow = [
                'Identificación',
                'Fechas',
                'Res',
                'Dur',
                'FPS',
                ...criteriaNames,
                'Total',
                'Comentarios'
            ];

            const tableBody = videos.map((v: any) => {
                const evalData = v.evaluation;
                const scoresMap = new Map(evalData.criterionScores.map((cs: any) => [cs.criterion.nombre, cs.puntaje]));

                const criteriaValues = criteriaNames.map(name => scoresMap.get(name) || '-');

                return [
                    v.participant.instagram,
                    `Sub: ${v.uploadedAt ? format(new Date(v.uploadedAt), 'dd/MM HH:mm') : '-'}\nEval: ${evalData.evaluatedAt ? format(new Date(evalData.evaluatedAt), 'dd/MM HH:mm') : '-'}`,
                    v.resolution || '-',
                    v.duration ? v.duration.toFixed(2) + 's' : '-',
                    v.fps || '-',
                    ...criteriaValues,
                    evalData.puntajeTotal.toFixed(1),
                    evalData.observacionesGenerales || '-'
                ];
            });

            // AutoTable
            autoTable(doc, {
                startY: 40,
                head: [headRow],
                body: tableBody,
                headStyles: { fillColor: [102, 51, 153], textColor: 255, fontStyle: 'bold', halign: 'center' },
                bodyStyles: { valign: 'middle' },
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                columnStyles: {
                    0: { cellWidth: 40 }, // Identificación
                    1: { cellWidth: 35 }, // Fechas
                    [headRow.length - 1]: { cellWidth: 50 } // Comentarios (Last column)
                },
                didParseCell: (data) => {
                    // Center align everything except maybe comments/id
                    if (data.section === 'body' && data.column.index > 1 && data.column.index < headRow.length - 1) {
                        data.cell.styles.halign = 'center';
                    }
                }
            });

            // 3. Convert to Base64
            const pdfBase64 = doc.output('datauristring').split(',')[1]; // Remove header

            // 4. Send to API
            await axios.post(`/api/admin/judges/${judge.id}/send-thank-you`, {
                pdfBase64
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            document.body.removeChild(loadingMsg);
            alert(`✅ ¡Regalo Enviado Exitosamente a ${judge.email}!`);

        } catch (e: any) {
            const el = document.getElementById('loading-pdf-mail');
            if (el) document.body.removeChild(el);
            console.error(e);
            alert('❌ Error enviando regalo: ' + (e.response?.data?.error || e.message));
        }
    };
    const handleEdit = (judge: Judge) => {
        setIsCreating(false);
        setEditingJudge(judge);
    };
    const handleCreate = () => {
        setIsCreating(true);
        setEditingJudge({
            id: '',
            nombre: '',
            apellido: '',
            profesion: '',
            biografia: '',
            email: '',
            telefono: '',
            instagram: '',
            fotoUrl: ''
        } as Judge);
    };
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header / Actions */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-700">Listado de Jueces</h3>
                <Button onClick={handleCreate} size="sm" className="text-xs">
                    + Incorporar Juez
                </Button>
            </div>
            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3">Juez</th>
                            <th className="px-4 py-3">Contacto</th>
                            <th className="px-4 py-3">Profesión / Bio</th>
                            <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {judges.map((judge) => (
                            <tr key={judge.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden relative border border-gray-200 shadow-sm">
                                            {judge.fotoUrl ? (
                                                <img src={judge.fotoUrl} alt={judge.nombre} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                                                    {judge.nombre.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-xl text-gray-900">{judge.nombre} {judge.apellido}</div>
                                            <div className="text-sm font-medium text-gray-600">{judge.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-base">
                                        <div className="mb-1">
                                            <span className="font-bold text-gray-700">Tlf:</span> <span className="text-black font-medium">{judge.telefono || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-700">IG:</span> <span className="text-black font-medium">{judge.instagram || '-'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 max-w-xs">
                                    <div className="font-medium text-lg text-gray-700">{judge.profesion || '-'}</div>
                                    <p className="text-sm text-gray-500 truncate max-w-md" title={judge.biografia}>{judge.biografia || '-'}</p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleSendWelcomeEmail(judge.id, judge.email)} className="text-purple-600 hover:text-purple-800 text-xs font-bold px-2 py-1 rounded bg-purple-50" title="Enviar Email Bienvenida">
                                            📧 Bienvenida
                                        </button>
                                        <button onClick={() => handleSendThankYou(judge)} className="text-green-600 hover:text-green-800 text-xs font-bold px-2 py-1 rounded bg-green-50 flex items-center gap-1" title="Enviar Agradecimiento Navideño">
                                            <Gift size={12} /> Agradecer
                                        </button>
                                        <button onClick={() => handleEdit(judge)} className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1 rounded bg-blue-50">
                                            Editar
                                        </button>
                                        <button onClick={() => handleResetPassword(judge.id, judge.nombre)} className="text-orange-600 hover:text-orange-800 text-xs font-bold px-2 py-1 rounded bg-orange-50 flex items-center gap-1" title="Restablecer Contraseña">
                                            <KeyRound size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(judge.id)} className="text-red-600 hover:text-red-800 text-xs font-bold px-2 py-1 rounded bg-red-50">
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {judges.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400">No hay perfiles de jueces registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Modal de Edición / Creación */}
            {editingJudge && (
                <EditJudgeModal
                    judge={editingJudge}
                    isCreating={isCreating}
                    token={token}
                    onClose={() => setEditingJudge(null)}
                    onSuccess={() => { setEditingJudge(null); onRefresh(); }}
                />
            )}
        </div>
    );
}
// Subcomponente Modal
function EditJudgeModal({ judge, isCreating, token, onClose, onSuccess }: { judge: Judge, isCreating: boolean, token: string, onClose: () => void, onSuccess: () => void }) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
        defaultValues: {
            ...judge
        }
    });
    const [uploading, setUploading] = useState(false);
    // Watch for changes in fotoUrl to update preview
    const fotoUrl = watch('fotoUrl');
    const onSubmit = async (data: any) => {
        try {
            if (isCreating) {
                await axios.post('/api/judges', data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.put(`/api/judges/${judge.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            onSuccess();
        } catch (e) {
            alert('Error al guardar');
        }
    };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post('/api/judges/upload-photo', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setValue('fotoUrl', res.data.url);
            }
        } catch (e) {
            alert('Error subiendo foto');
        } finally {
            setUploading(false);
        }
    };
    return (
        <Modal title={isCreating ? "Incorporar Jueza/Juez" : "Editar Perfil de Juez"} isOpen={true} onClose={onClose}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                        <Input {...register('nombre', { required: true })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Apellido</label>
                        <Input {...register('apellido')} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                    <Input {...register('email', { required: true })} />
                </div>
                {/* Password field removed. Default "Centauro2024" used in backend. */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                        <Input {...register('telefono')} autoComplete="off" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Instagram</label>
                        <Input {...register('instagram')} placeholder="@usuario" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Profesión</label>
                    <Input {...register('profesion')} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Trayectoria / Biografía</label>
                    <div className="relative">
                        <textarea
                            {...register('biografia')}
                            maxLength={350}
                            className="w-full text-base border-gray-300 rounded-lg p-3 border focus:ring-brand-purple focus:border-brand-purple text-gray-900 bg-white placeholder-gray-400"
                            placeholder="Escribe aquí una breve biografía..."
                            rows={5}
                            onChange={(e) => {
                                register('biografia').onChange(e); // Mantener funcionalidad de react-hook-form
                                // Forzar re-render si fuera necesario para el contador, aunque watch lo hace
                            }}
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {watch('biografia')?.length || 0}/350 caracteres
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg flex items-center gap-6">
                    <div className="flex-shrink-0 w-32 h-32 bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
                        {fotoUrl ? (
                            <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-400 text-sm font-bold">Sin foto</span>
                        )}
                    </div>
                    <div className="flex-grow">
                        <label className="block text-xs font-bold text-gray-700 mb-2">Fotografía (Perfil)</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-purple file:text-white hover:file:bg-brand-orange transition-colors" />
                        {uploading && <span className="text-xs text-brand-purple mt-1 block">Subiendo imagen...</span>}
                        <input type="hidden" {...register('fotoUrl')} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={uploading}>
                        {isCreating ? 'Registrar Juez' : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
