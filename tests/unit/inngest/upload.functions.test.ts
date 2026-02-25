import { afterAll, describe, expect, it, mock } from "bun:test";

mock.restore();

// --- MOCK SETUP ---
mock.module("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    storage: {
      from: mock(() => ({
        upload: mock(),
        remove: mock(),
        listBuckets: mock(),
        createBucket: mock(),
      })),
      listBuckets: mock(),
      createBucket: mock(),
    },
  },
}));

const { handleFileUpload, handleFileDelete } = await import(
  "@/inngest/functions/upload.functions"
);
const { supabaseAdmin } = await import("@/lib/supabase/admin");

afterAll(() => {
  mock.restore();
});

describe("Inngest: Upload Functions", () => {
  describe("handleFileUpload", () => {
    it("should upload file to bucket", async () => {
      // Note: Testing Inngest functions unit-style requires mocking the 'step' object
      const mockStep = {
        run: mock((id: string, fn: () => any) => fn()),
      };

      const event = {
        data: {
          bucket: "products",
          filename: "test.jpg",
          fileBuffer: Buffer.from("test").toString("base64"),
          contentType: "image/jpeg",
        },
      };

      // Mock bucket exists check
      (supabaseAdmin.storage.listBuckets as any).mockResolvedValue({
        data: [{ name: "products" }],
        error: null,
      });

      (supabaseAdmin.storage.from as any).mockReturnValue({
        upload: mock(() => ({ error: null })),
      });

      await (handleFileUpload as any).fn({ event, step: mockStep });

      expect(mockStep.run).toHaveBeenCalledWith(
        "ensure-bucket-exists",
        expect.any(Function),
      );
      expect(mockStep.run).toHaveBeenCalledWith(
        "upload-to-supabase",
        expect.any(Function),
      );
    });
  });

  describe("handleFileDelete", () => {
    it("should remove files from bucket", async () => {
      const mockStep = {
        run: mock((id: string, fn: () => any) => fn()),
      };

      const event = {
        data: {
          bucket: "products",
          urls: [
            "https://example.com/storage/v1/object/public/products/test.jpg",
          ],
        },
      };

      (supabaseAdmin.storage.from as any).mockReturnValue({
        remove: mock(() => ({ data: [], error: null })),
      });

      await (handleFileDelete as any).fn({ event, step: mockStep });

      expect(mockStep.run).toHaveBeenCalledWith(
        "delete-from-supabase",
        expect.any(Function),
      );
    });
  });
});
