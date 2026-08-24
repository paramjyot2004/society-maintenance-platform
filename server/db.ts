import prismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { PrismaClient } = (prismaPkg as any).default || prismaPkg;
export type { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;
let pgPool: pg.Pool | null = null;

export function getPrisma(): PrismaClient | null {
  if (!prismaClient) {
    try {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        return null;
      }

      pgPool = new pg.Pool({ connectionString });
      const adapter = new PrismaPg(pgPool);

      prismaClient = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    } catch (err) {
      console.warn('[Prisma] Client initialization deferred or database not yet configured:', err);
      return null;
    }
  }
  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getPrisma();
    if (!client) {
      return new Proxy(() => {}, {
        get() {
          return () => Promise.reject(new Error('Prisma Client not initialized or DATABASE_URL not configured'));
        },
        apply() {
          return Promise.reject(new Error('Prisma Client not initialized or DATABASE_URL not configured'));
        }
      });
    }
    return Reflect.get(client, prop, receiver);
  }
});

export default prisma;

