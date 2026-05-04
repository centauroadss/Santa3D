import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTasaDelDia(): Promise<number> {
    try {
        const ultimaTasa = await prisma.tasaBcvHistorico.findFirst({
            orderBy: {
                fecha: 'desc'
            }
        });

        if (!ultimaTasa) {
            throw new Error('No se encontró ninguna tasa del BCV en la base de datos.');
        }

        return Number(ultimaTasa.tasaUsdBs);
    } catch (error) {
        console.error('Error obteniendo tasa del BCV:', error);
        throw error;
    }
}
