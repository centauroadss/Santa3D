// lib/auth.ts - Autenticación Completa (Node.js Runtime)
import bcrypt from 'bcryptjs';

export * from './auth-edge';

// Hash password (Node.js Only)

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Verificar password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
