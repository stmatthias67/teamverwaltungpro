// lib/prisma.js
/**
 * Prisma Client Singleton Instance
 * Prevents multiple PrismaClient instances in Next.js development
 * Reference: https://www.prisma.io/docs/reference/api-reference/prisma-client-constructor
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
