import { PrismaClient } from '@prisma/client';

// Uma única instância para todo o processo. Em dev, o `node --watch` reinicia
// o módulo a cada alteração; guardar no globalThis evita abrir uma conexão
// nova (e vazar) a cada reload.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}
