import { afterAll, describe, expect, it, mock } from "bun:test";

mock.restore();

// --- MOCK SETUP ---
mock.module("sharp", () => {
  const sharpMock = {
    resize: mock().mockReturnThis(),
    webp: mock().mockReturnThis(),
    blur: mock().mockReturnThis(),
    toBuffer: mock().mockResolvedValue(Buffer.from("mock-buffer")),
  };
  return {
    default: mock(() => sharpMock),
  };
});

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

type InngestHandlerFn = {
  fn: (args: { event: unknown; step?: unknown }) => Promise<unknown>;
};

afterAll(() => {
  mock.restore();
});

describe("Inngest: Upload Functions", () => {
  describe("handleFileUpload", () => {
    it("should upload file to bucket", async () => {
      // Note: Testing Inngest functions unit-style requires mocking the 'step' object
      const mockStep = {
        run: mock((_id: string, fn: () => unknown) => fn()),
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
      (
        supabaseAdmin.storage.listBuckets as ReturnType<typeof mock>
      ).mockResolvedValue({
        data: [{ name: "products" }],
        error: null,
      });

      (supabaseAdmin.storage.from as ReturnType<typeof mock>).mockReturnValue({
        upload: mock(() => ({ error: null })),
      });

      await (handleFileUpload as InngestHandlerFn).fn({
        event,
        step: mockStep,
      });

      expect(mockStep.run).toHaveBeenCalledWith(
        "ensure-bucket-exists",
        expect.any(Function),
      );
      expect(mockStep.run).toHaveBeenCalledWith(
        "process-main-image",
        expect.any(Function),
      );
      expect(mockStep.run).toHaveBeenCalledWith(
        "upload-main-to-supabase",
        expect.any(Function),
      );
      expect(mockStep.run).toHaveBeenCalledWith(
        "process-blur-image",
        expect.any(Function),
      );
      expect(mockStep.run).toHaveBeenCalledWith(
        "upload-blur-to-supabase",
        expect.any(Function),
      );
    });
  });

  describe("handleFileDelete", () => {
    it("should remove files from bucket", async () => {
      const mockStep = {
        run: mock((_id: string, fn: () => unknown) => fn()),
      };

      const event = {
        data: {
          bucket: "products",
          urls: [
            "https://example.com/storage/v1/object/public/products/test.jpg",
          ],
        },
      };

      (supabaseAdmin.storage.from as ReturnType<typeof mock>).mockReturnValue({
        remove: mock(() => ({ data: [], error: null })),
      });

      await (handleFileDelete as InngestHandlerFn).fn({
        event,
        step: mockStep,
      });

      expect(mockStep.run).toHaveBeenCalledWith(
        "delete-from-supabase",
        expect.any(Function),
      );
    });
  });
});
