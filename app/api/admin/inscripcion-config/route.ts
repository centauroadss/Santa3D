import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const config = await prisma.configConcurso.findUnique({
            where: { clave: 'INSCRIPCION_CONFIG' }
        });
        
        const paymentConfigs = await prisma.configConcurso.findMany({
            where: {
                clave: {
                    in: ['pago_banco', 'pago_cedula', 'pago_telefono']
                }
            }
        });
        
        const paymentData = paymentConfigs.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {} as Record<string, string>);
        
        let responseConfig = null;
        if (config) {
            responseConfig = JSON.parse(config.valor);
        }
        
        const bcvRecord = await prisma.tasaBcvHistorico.findFirst({
            orderBy: { fecha: 'desc' }
        });
        const tasaBcv = bcvRecord ? parseFloat(bcvRecord.tasaUsdBs.toString()) : 0;
        
        return NextResponse.json({ 
            config: responseConfig,
            payment: {
                banco: paymentData['pago_banco'] || 'Banesco',
                cedula: paymentData['pago_cedula'] || 'J123456789',
                telefono: paymentData['pago_telefono'] || '04140000000'
            },
            tasaBcv: tasaBcv
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching config' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { config } = await req.json();
        
        await prisma.configConcurso.upsert({
            where: { clave: 'INSCRIPCION_CONFIG' },
            update: { valor: JSON.stringify(config) },
            create: { clave: 'INSCRIPCION_CONFIG', valor: JSON.stringify(config), descripcion: 'Configuración de Costos y Categorías de Inscripción' }
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error saving config' }, { status: 500 });
    }
}
