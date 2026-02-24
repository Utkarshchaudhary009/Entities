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

function parseConnectionConfig(url: string): {
  connectionString: string;
  ssl: { rejectUnauthorized: boolean } | false;
} {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isSupabase =
      host.includes("supabase.com") || host.includes("supabase.co");

    if (isSupabase) {
      parsed.searchParams.delete("sslmode");
      return {
        connectionString: parsed.toString(),
        ssl: { rejectUnauthorized: false },
      };
    }

    return { connectionString: url, ssl: false };
  } catch {
    return { connectionString: url, ssl: false };
  }
}

const { connectionString, ssl } = parseConnectionConfig(rawConnectionString);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString,
    ssl,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
