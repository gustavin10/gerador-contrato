import { PrismaClient } from '@prisma/client';

// Em dev o `node --watch` recarrega o módulo a cada alteração. Guardar a
// instância no globalThis evita abrir uma conexão nova a cada reload.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}
