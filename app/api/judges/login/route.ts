import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { judgeLoginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  console.log('🟣 Backend: Request recibido en /api/judges/login');
  try {
    const body = await request.json();
    console.log('🟣 Backend: Body parseado:', body.email);

    // Validar datos
    const validatedData = judgeLoginSchema.parse(body);
    console.log('🟣 Backend: Zod validación OK');

    let judge = await prisma.judge.findUnique({
      where: { email: validatedData.email },
    });
    console.log('🟣 Backend: Búsqueda de Juez terminada. Existe:', !!judge);



    // SI EXISTE: Verificamos contraseña normalmente
    if (!judge) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas.' }, // Generic msg for security, though frontend pre-checks email
        { status: 401 }
      );
    }

    if (!judge.password) {
      return NextResponse.json(
        { success: false, error: 'SETUP_REQUIRED', message: 'Debe configurar su contraseña primero.' },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(validatedData.password, judge.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CREDENTIALS', message: 'No coincidencia de password.' }, // User requested specific message
        { status: 401 }
      );
    }

    // Generar Token
    const token = await generateToken({
      id: judge.id,
      email: judge.email,
      role: judge.role as 'JUDGE' | 'ADMIN',
    });

    // Crear respuesta
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        judge: {
          id: judge.id,
          nombre: judge.nombre,
          email: judge.email,
          role: judge.role,
        },
        expiresIn: '7d',
      },
    });

    // Establecer Cookie para el Middleware
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error in judge login:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
