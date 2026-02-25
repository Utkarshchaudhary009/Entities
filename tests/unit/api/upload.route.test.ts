import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

mock.restore();

// --- MOCK SETUP ---
mock.module("@/lib/auth/guards", () => ({
  requireAdmin: mock(),
}));

mock.module("@/inngest/safe-send", () => ({
  safeInngestSend: mock(),
}));

const { POST } = await import("@/app/api/upload/route");
const { requireAdmin } = await import("@/lib/auth/guards");
const { safeInngestSend } = await import("@/inngest/safe-send");

afterAll(() => {
  mock.restore();
});

describe("API: Upload", () => {
  beforeEach(() => {
    (requireAdmin as any).mockReset();
    (safeInngestSend as any).mockReset();
  });

  it("should reject unauthorized users", async () => {
    (requireAdmin as any).mockResolvedValue({
      success: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/upload", { method: "POST" }),
    );
    expect(response.status).toBe(401);
  });

  it("should reject files larger than 10MB", async () => {
    (requireAdmin as any).mockResolvedValue({
      success: true,
      auth: { userId: "admin" },
    });

    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)],
      "large.jpg",
      { type: "image/jpeg" },
    );
    const formData = new FormData();
    formData.append("file", largeFile);
    formData.append("filename", "test.jpg");
    formData.append("bucket", "products");

    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("exceeds 10MB");
  });

  it("should trigger Inngest and return 202 on successful upload request", async () => {
    (requireAdmin as any).mockResolvedValue({
      success: true,
      auth: { userId: "admin" },
    });
    (safeInngestSend as any).mockResolvedValue({ ids: ["123"] });

    const file = new File([new ArrayBuffer(1024)], "test.png", {
      type: "image/png",
    });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", "uuid.png");
    formData.append("bucket", "products");

    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(202);
    expect(safeInngestSend).toHaveBeenCalled();
  });
});
