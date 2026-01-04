// lib/auth-edge.ts - Autenticación JWT (Compatible con Edge Runtime)
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-change-in-production'
);

export interface JWTPayload {
    id: string;
    email: string;
    role: 'JUDGE' | 'ADMIN';
}

// Generar token JWT
export async function generateToken(payload: JWTPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

// Verificar token JWT
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as JWTPayload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

// Extraer token del header Authorization
export function extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

// Middleware para verificar autenticación
export async function authenticateRequest(
    request: NextRequest
): Promise<JWTPayload | null> {
    const token = extractToken(request);
    if (!token) {
        return null;
    }
    return await verifyToken(token);
}
