import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { logProfileError } from "./profile-errors";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };
const cachedClient = globalForPrisma.prisma;

// A regenerated client has a new constructor; don't retain an outdated schema during HMR.
export const prisma = cachedClient instanceof PrismaClient
  ? cachedClient
  : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  if (cachedClient && cachedClient !== prisma) {
    void cachedClient.$disconnect().catch((error: unknown) => {
      logProfileError("[Prisma] Falha ao encerrar o client desatualizado", error);
    });
  }
  globalForPrisma.prisma = prisma;
}
