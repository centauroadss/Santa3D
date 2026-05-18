// lib/prisma.ts - Cliente Prisma
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Parche temporal para asegurar conexión a DB desde el contenedor EasyPanel
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('172.17.0.1')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('172.17.0.1', '167.172.217.151');
}

export const prisma = (globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })).$extends({
    query: {
      $allModels: {
        async deleteMany({ args, query }) {
          if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL?.includes('test')) {
            throw new Error('❌ ALERTA DE SEGURIDAD: Intento de deleteMany en pruebas sin una base de datos aislada (falta sufijo "test" en DATABASE_URL). Operación abortada para proteger datos productivos.');
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
