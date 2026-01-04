import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const participants = await prisma.participant.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        instagram: true,
        fechaNacimiento: true,
        // edad: true, // ELIMINADO PORQUE NO EXISTE EN DB
        createdAt: true,
        video: {
          select: {
            url: true,
            status: true,
            fileName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    // Convertir a CSV simple
    const csvHeader = 'ID,Nombre,Apellido,Email,Telefono,Instagram,Fecha Nacimiento,Video URL,Estado Video,Fecha Registro\n';
    const csvRows = participants.map(p => {
      const vidUrl = p.video?.url || '';
      const vidStatus = p.video?.status || 'NO_VIDEO';
      const fechaNac = p.fechaNacimiento ? new Date(p.fechaNacimiento).toISOString().split('T')[0] : '';
      const fechaReg = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '';
      
      return `"${p.id}","${p.nombre}","${p.apellido}","${p.email}","${p.telefono||''}","${p.instagram}","${fechaNac}","${vidUrl}","${vidStatus}","${fechaReg}"`;
    }).join('\n');
    return new NextResponse(csvHeader + csvRows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="participantes.csv"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
