import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createClient() {
  const url = (process.env.DATABASE_URL ?? "").replace(/^['"]|['"]$/g, "");
  if (!url) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const pool = globalForPrisma.pool ?? new Pool({ connectionString: url });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

// In production: singleton so the client isn't re-instantiated on every request.
// In development: singleton attached to globalThis to prevent connection pool exhaustion.
export const db =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ?? (globalForPrisma.prisma = createClient()))
    : createClient();
