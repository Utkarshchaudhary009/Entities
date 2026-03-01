import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from "bun:test";

mock.restore();

// --- MOCK SETUP ---
mock.module("@/lib/auth/guards", () => ({
  requireAuth: mock(),
  requireAdmin: mock(),
}));

mock.module("@/inngest/safe-send", () => ({
  safeInngestSend: mock(),
}));

mock.module("next/cache", () => ({
  revalidatePath: mock(),
  revalidateTag: mock(),
}));

// Mock services
mock.module("@/services/category.service", () => ({
  categoryService: { findAll: mock(), create: mock() },
}));

// Import routes
const CategoryRoute = await import("@/app/api/categories/route");

const { requireAdmin } = await import("@/lib/auth/guards");
const { categoryService } = await import("@/services/category.service");

const ROUTES = [
  {
    name: "Categories",
    route: CategoryRoute,
    service: categoryService,
    endpoint: "categories",
    validBody: {
      name: "C1",
      slug: "c1",
      isActive: true,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    },
  },
];

afterAll(() => {
  mock.restore();
});

describe("API: Generic Routes", () => {
  beforeEach(() => {
    (requireAdmin as any).mockReset();
  });

  ROUTES.forEach(({ name, route, service, endpoint, validBody }) => {
    describe(name, () => {
      beforeEach(() => {
        (service.findAll as any).mockReset();
        (service.create as any).mockReset();
      });

      it(`GET /api/${endpoint} should return items`, async () => {
        (service.findAll as any).mockResolvedValue({
          data: [],
          meta: { total: 0 },
        });
        const response = await route.GET(
          new Request(`http://localhost/api/${endpoint}`),
        );
        expect(response.status).toBe(200);
      });

      it(`POST /api/${endpoint} should create item if admin`, async () => {
        (requireAdmin as any).mockResolvedValue({
          success: true,
          auth: { userId: "admin" },
        });
        (service.create as any).mockResolvedValue({ id: "1", ...validBody });

        // Map back to DB structure for mock return
        const dbEntity = { ...validBody };
        if (dbEntity.hex) {
          dbEntity.hexCode = dbEntity.hex;
          delete dbEntity.hex;
        }

        const request = new Request(`http://localhost/api/${endpoint}`, {
          method: "POST",
          body: JSON.stringify(validBody),
        });
        (service.create as any).mockResolvedValue({ id: "1", ...dbEntity });

        const response = await route.POST(request);
        expect(response.status).toBe(201);
      });
    });
  });
});
