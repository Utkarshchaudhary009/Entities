import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const rawConnectionString =
  process.env.SUPABASE_POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.SUPABASE_POSTGRES_URL;

if (!rawConnectionString) {
  throw new Error(
    "Missing database URL. Set SUPABASE_POSTGRES_URL_NON_POOLING (preferred), DATABASE_URL, or SUPABASE_POSTGRES_URL.",
  );
}

function buildConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("sslmode");
    return parsed.toString();
  } catch {
    return url;
  }
}

const connectionString = buildConnectionString(rawConnectionString);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
