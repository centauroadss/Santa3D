import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTasaDelDia(): Promise<number> {
    try {
        // Calcular la "medianoche de hoy" en hora de Caracas
        // Para asegurar que si la tasa de mañana ya fue publicada hoy a las 4:30 PM,
        // no se empiece a cobrar hasta que pasen las 12:00 de la medianoche.
        const hoyCaracas = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Caracas" }));
        hoyCaracas.setHours(0, 0, 0, 0);

        const ultimaTasa = await prisma.tasaBcvHistorico.findFirst({
            where: {
                fecha: {
                    lte: hoyCaracas // Solo tasas cuya fecha sea MENOR O IGUAL a hoy
                }
            },
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
