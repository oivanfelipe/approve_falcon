import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Reuse the same PrismaClient (and its underlying connection pool) across
// module reloads in dev AND across warm serverless invocations in
// production. Without this, every cold/warm invocation on Vercel opened a
// brand new pg.Pool, quickly exhausting Supabase's connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Prisma 7 uses the Wasm "client" engine which requires a driver adapter.
  // Cap the pool size per instance: serverless functions run many
  // concurrent isolated instances, so each one must only hold a handful of
  // connections against Supabase's shared connection limit. The real fix is
  // switching DATABASE_URL to Supabase's transaction-mode pooler (port
  // 6543), which doesn't hold per-instance connections open the way the
  // session-mode pooler does — see the connection pooling settings in the
  // Supabase dashboard. Until then, keep this as low as viable.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
