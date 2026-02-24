import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.SUPABASE_POSTGRES_URL_NON_POOLING;
if (!connectionString) {
  throw new Error(
    "Missing env SUPABASE_POSTGRES_URL_NON_POOLING (required for Prisma Postgres connection).",
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const shouldUseSsl =
    process.env.NODE_ENV === "production" ||
    process.env.PRISMA_USE_SSL === "true";
  const allowInsecureSslInNonProd =
    process.env.NODE_ENV !== "production" &&
    process.env.PRISMA_ALLOW_INSECURE_SSL === "true";

  const pool = new Pool({
    connectionString,
    ssl: shouldUseSsl
      ? { rejectUnauthorized: !allowInsecureSslInNonProd }
      : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
