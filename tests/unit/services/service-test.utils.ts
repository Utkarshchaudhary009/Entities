import { mock } from "bun:test";

export async function setupServiceModule<TModule>(options: {
  serviceSourcePath: string;
  prismaMock: unknown;
}): Promise<TModule> {
  mock.restore();

  mock.module("@/lib/prisma", () => ({
    default: options.prismaMock,
  }));

  const cacheBust = `service-test-${Date.now()}-${Math.random()}`;
  return (await import(`${options.serviceSourcePath}?${cacheBust}`)) as TModule;
}
