import { mock } from "bun:test";

export async function setupServiceModule<TModule>(options: {
  serviceAlias: string;
  serviceSourcePath: string;
  prismaMock: unknown;
}): Promise<TModule> {
  mock.restore();

  mock.module("@/lib/prisma", () => ({
    default: options.prismaMock,
  }));

  const realServiceModule = await import(options.serviceSourcePath);
  mock.module(options.serviceAlias, () => realServiceModule);

  return (await import(options.serviceAlias)) as TModule;
}
