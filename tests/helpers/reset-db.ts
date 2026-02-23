import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function resetDb() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ DANGER: Attempted to reset production database!");
  }

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tablesToTruncate = tablenames
    .map(({ tablename }) => `"${tablename}"`)
    .filter((name) => name !== '"_prisma_migrations"');

  try {
    // Truncate all tables in a single command with CASCADE to handle foreign keys
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${tablesToTruncate.join(", ")} CASCADE;`,
    );
  } catch (error) {
    console.error("Failed to reset database:", error);
  }
}

export { prisma };
