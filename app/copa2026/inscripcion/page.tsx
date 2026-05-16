import { PrismaClient } from '@prisma/client';
import InscripcionWizard from '@/components/copa2026/forms/InscripcionWizard';
import { getTasaDelDia } from '@/lib/copa2026/bcv';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function InscripcionPage() {
    // Obtener la tasa del BCV más reciente
    const tasaBcv = await getTasaDelDia().catch(() => 0);

    let bancos = [];
    let configMap: Record<string, string> = {};
    try {
        const bancosRaw = await prisma.banco.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' }
        });
        bancos = bancosRaw.map(b => ({ codigo: b.codigo, nombre: b.nombre }));

        const configs = await prisma.configConcurso.findMany({
            where: {
                clave: {
                    in: ['pago_telefono', 'pago_cedula', 'pago_banco', 'costo_una_categoria', 'costo_ambas_categorias']
                }
            }
        });
        configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);
    } catch (e) {
        console.warn("No DB connection locally, using fallbacks");
    }

    // Por defecto, valores de ejemplo por si no están configurados en BD
    const fallbackConfig = { telefono: '04140000000', cedula: 'J123456789', banco: 'Banesco' };

    const configPago = {
        telefono: configMap['pago_telefono'] || fallbackConfig.telefono,
        cedula: configMap['pago_cedula'] || fallbackConfig.cedula,
        banco: configMap['pago_banco'] || fallbackConfig.banco,
    };

    const costoUnaCategoria = parseFloat(configMap['costo_una_categoria'] || '5');
    const costoAmbasCategorias = parseFloat(configMap['costo_ambas_categorias'] || '10');

    return (
        <div className="min-h-screen bg-[#050505] text-white py-12 px-4 md:px-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 mb-4">
                        Inscripción Oficial
                    </h1>
                    <p className="text-neutral-400">Completa tus datos para participar en la Copa Santa 3D 2026.</p>
                </div>

                {tasaBcv > 0 ? (
                    <InscripcionWizard 
                        tasaBcv={tasaBcv}
                        costoUnaCategoria={costoUnaCategoria}
                        costoAmbasCategorias={costoAmbasCategorias}
                        configPago={configPago}
                    />
                ) : (
                    <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                        <p className="text-xl font-bold mb-2">Error de Conexión</p>
                        <p>No se pudo obtener la tasa oficial del BCV del día. Por favor intenta más tarde.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
