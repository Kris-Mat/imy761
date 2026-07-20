import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | undefined;

// Lazy singleton: reads DATABASE_URL on first use, not at import time, so it
// always runs after each app's server.ts has called dotenv.config().
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
