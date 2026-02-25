import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import { useUploadStore } from "@/stores/upload.store";

describe("Store: Upload", () => {
  beforeEach(() => {
    // Reset Zustand store state
    useUploadStore.setState({ uploads: new Map() });
  });

  it("should stage valid files and generate public URLs", () => {
    const store = useUploadStore.getState();
    const file = new File(["test content"], "image.png", { type: "image/png" });

    const urls = store.stageFiles([file], "products");

    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("/storage/v1/object/public/products/");
    expect(useUploadStore.getState().uploads.size).toBe(1);
  });

  it("should reject invalid file types", () => {
    // Suppress expected console.error from file validation
    const consoleSpy = spyOn(console, "error").mockImplementation(() => { });
    const store = useUploadStore.getState();
    const file = new File(["test content"], "dangerous.exe", {
      type: "application/x-msdownload",
    });

    const urls = store.stageFiles([file], "products");

    expect(urls).toHaveLength(0);
    expect(useUploadStore.getState().uploads.size).toBe(0);
    consoleSpy.mockRestore();
  });

  it("should transition status correctly", () => {
    const store = useUploadStore.getState();
    const file = new File(["test content"], "image.png", { type: "image/png" });
    const urls = store.stageFiles([file], "products");

    // Find the ID (filename) from the URL
    const id = urls[0].split("/").pop() ?? "";

    expect(useUploadStore.getState().uploads.get(id)?.status).toBe("pending");

    useUploadStore.getState().markUploading(id);
    expect(useUploadStore.getState().uploads.get(id)?.status).toBe("uploading");

    useUploadStore.getState().markDone(id);
    expect(useUploadStore.getState().uploads.get(id)?.status).toBe("done");

    useUploadStore.getState().markError(id, "Failed");
    expect(useUploadStore.getState().uploads.get(id)?.status).toBe("error");
    expect(useUploadStore.getState().uploads.get(id)?.error).toBe("Failed");
  });
});
