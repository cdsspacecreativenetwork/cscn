import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const url = (process.env.DATABASE_URL ?? "").replace(/^['"]|['"]$/g, "");
  const adapter = new PrismaNeonHttp(url, {});
  return new PrismaClient({ adapter });
}

// Neon HTTP is connectionless — no persistent pool to exhaust.
// In production: singleton so the client isn't re-instantiated on every request.
// In development: always fresh so schema changes (prisma generate) take effect
// immediately without requiring a server restart.
export const db =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ?? (globalForPrisma.prisma = createClient()))
    : createClient();
