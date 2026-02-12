// lib/prismadb.ts - Proper Prisma client setup for MongoDB
import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

export default prisma;