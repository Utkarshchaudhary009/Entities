import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

// --- MOCK SETUP ---
mock.module("@/lib/auth/guards", () => ({
  requireAuth: mock(),
  requireAdmin: mock(),
}));

mock.module("@/inngest/safe-send", () => ({
  safeInngestSend: mock(),
}));

// Mock services
mock.module("@/services/category.service", () => ({ categoryService: { findAll: mock(), create: mock() } }));
mock.module("@/services/color.service", () => ({ colorService: { findAll: mock(), create: mock() } }));
mock.module("@/services/size.service", () => ({ sizeService: { findAll: mock(), create: mock() } }));

// Import routes
const CategoryRoute = await import("@/app/api/categories/route");
const ColorRoute = await import("@/app/api/colors/route");
const SizeRoute = await import("@/app/api/sizes/route");

const { requireAdmin } = await import("@/lib/auth/guards");
const { categoryService } = await import("@/services/category.service");
const { colorService } = await import("@/services/color.service");
const { sizeService } = await import("@/services/size.service");

const ROUTES = [
  { name: "Categories", route: CategoryRoute, service: categoryService, endpoint: "categories", validBody: { name: "C1", slug: "c1" } },
  { name: "Colors", route: ColorRoute, service: colorService, endpoint: "colors", validBody: { name: "Red", hex: "#FF0000" } },
  { name: "Sizes", route: SizeRoute, service: sizeService, endpoint: "sizes", validBody: { label: "XL" } },
];

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
        (service.findAll as any).mockResolvedValue({ data: [], meta: { total: 0 } });
        const response = await route.GET(new Request(`http://localhost/api/${endpoint}`));
        expect(response.status).toBe(200);
      });

      it(`POST /api/${endpoint} should create item if admin`, async () => {
        (requireAdmin as any).mockResolvedValue({ success: true, auth: { userId: "admin" } });
        (service.create as any).mockResolvedValue({ id: "1", ...validBody });

        const request = new Request(`http://localhost/api/${endpoint}`, {
          method: "POST",
          body: JSON.stringify(validBody),
        });
        const response = await route.POST(request);
        expect(response.status).toBe(201);
      });
    });
  });
});
