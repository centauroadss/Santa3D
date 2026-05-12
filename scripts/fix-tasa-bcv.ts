import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando migración de fechas de TasaBcvHistorico...');
  const registros = await prisma.tasaBcvHistorico.findMany();
  
  for (const registro of registros) {
    if (!registro.fechaValor) {
      // Tomamos la fecha (que está en UTC 00:00 del día anterior típicamente si se corrió en la tarde)
      const fecha = new Date(registro.fecha);
      
      // Le sumamos 1 día para estimar la "fecha valor" original
      // Asumimos que si se corrió el 11/05 a las 8pm, la fecha en BD es 11/05
      // y la fecha valor correspondiente es el 12/05
      fecha.setUTCDate(fecha.getUTCDate() + 1);
      
      // Si cae en sábado (6) o domingo (0), la movemos al lunes
      if (fecha.getUTCDay() === 6) {
        fecha.setUTCDate(fecha.getUTCDate() + 2);
      } else if (fecha.getUTCDay() === 0) {
        fecha.setUTCDate(fecha.getUTCDate() + 1);
      }
      
      await prisma.tasaBcvHistorico.update({
        where: { id: registro.id },
        data: { fechaValor: fecha }
      });
      console.log(`Actualizado ID ${registro.id}: Fecha Ejec ${registro.fecha.toISOString()} -> Fecha Valor ${fecha.toISOString()}`);
    }
  }
  console.log('Migración completada.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
