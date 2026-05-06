import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __cpfaPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__cpfaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__cpfaPrisma = prisma;
}

export * from '@prisma/client';
