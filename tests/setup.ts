import { beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import * as auth from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ role: 'ADMIN' })
}));

let db: any[] = [];
let idCounter = 1;

(prisma as any).tasaBcvHistorico = {
  findMany: vi.fn(async (args?: any) => {
    let res = [...db];
    if (args?.orderBy?.fechaValor === 'asc') {
      res.sort((a, b) => +a.fechaValor - +b.fechaValor);
    } else if (args?.orderBy?.fechaValor === 'desc' || args?.orderBy?.fecha === 'desc') {
      res.sort((a, b) => +b.fechaValor - +a.fechaValor);
    }
    if (args?.take) res = res.slice(0, args.take);
    return res;
  }),
  findUnique: vi.fn(async ({ where }: any) => {
    return db.find(r => {
      if (where.id && r.id === where.id) return true;
      if (where.fecha && +r.fecha === +where.fecha) return true;
      if (where.fechaValor && +r.fechaValor === +where.fechaValor) return true;
      return false;
    }) || null;
  }),
  findFirst: vi.fn(async (args?: any) => {
    let res = [...db];
    if (args?.where?.OR) {
      res = res.filter(r => 
        args.where.OR.some((cond: any) => {
          if (cond.fechaValor && +r.fechaValor === +cond.fechaValor) return true;
          if (cond.tasaUsdBs && r.tasaUsdBs === cond.tasaUsdBs) return true;
          return false;
        })
      );
    } else if (args?.where?.fechaValor?.lte) {
      res = res.filter(r => +r.fechaValor <= +args.where.fechaValor.lte);
    } else if (args?.where) {
      // Basic matching for exact fields if not OR/lte
      for (const key of Object.keys(args.where)) {
         if (key !== 'OR' && args.where[key]) {
             if (typeof args.where[key] === 'object' && args.where[key].lt) {
                 res = res.filter(r => +r[key] < +args.where[key].lt);
             } else {
                 res = res.filter(r => r[key] === args.where[key] || +r[key] === +args.where[key]);
             }
         }
      }
    }
    if (args?.orderBy?.fechaValor === 'desc') {
      res.sort((a, b) => +b.fechaValor - +a.fechaValor);
    } else if (args?.orderBy?.fecha === 'desc') {
      res.sort((a, b) => +b.fecha - +a.fecha);
    }
    if (args?.where?.OR && res.length > 0) {
      console.log('findFirst OR match:', res[0], 'for args:', args.where.OR, 'db is:', db);
    }
    return res[0] || null;
  }),
  count: vi.fn(async () => db.length),
  create: vi.fn(async ({ data }: any) => {
    // Mimic R1 check constraint
    if (data.fechaValor.getTime() <= data.fecha.getTime()) {
      throw new Error('Check constraint violation: fechaValor <= fecha');
    }
    // Mimic unique constraints
    const conflict = db.find(r => 
      r.fecha.getTime() === data.fecha.getTime() ||
      r.fechaValor.getTime() === data.fechaValor.getTime() ||
      r.tasaUsdBs === data.tasaUsdBs
    );
    if (conflict) {
      throw new Error('Unique constraint violation');
    }
    const nw = { id: idCounter++, ...data };
    db.push(nw);
    return nw;
  }),
  createMany: vi.fn(async ({ data }: any) => {
    const toInsert = Array.isArray(data) ? data : [data];
    for (const item of toInsert) {
      db.push({ id: idCounter++, fechaEjecucion: new Date(), ...item });
    }
    return { count: toInsert.length };
  }),
  deleteMany: vi.fn(async () => {
    const count = db.length;
    console.log('deleteMany called, clearing db. Previous length:', count);
    db = [];
    return { count };
  }),
  upsert: vi.fn(async ({ where, update, create }: any) => {
    const existingIdx = db.findIndex(r => +r.fechaValor === +where.fechaValor || (where.fecha && +r.fecha === +where.fecha));
    if (existingIdx >= 0) {
      db[existingIdx] = { ...db[existingIdx], ...update };
      return db[existingIdx];
    } else {
      const nw = { id: idCounter++, ...create };
      db.push(nw);
      return nw;
    }
  })
};

(prisma as any).configConcurso = {
  findMany: vi.fn(async () => [
    { clave: 'costo_una_categoria', valor: '5' },
    { clave: 'costo_ambas_categorias', valor: '10' }
  ])
};

beforeEach(() => {
  db = [];
  vi.useRealTimers();
});
