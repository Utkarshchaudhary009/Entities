import { describe, expect, it } from "bun:test";
import { cn } from "@/lib/utils";

describe("Utils", () => {
  describe("cn (className merger)", () => {
    it("should merge standard classes", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle conditional classes", () => {
      const condition = true;
      const result = cn(
        "base",
        condition && "active",
        !condition && "inactive",
      );
      expect(result).toBe("base active");
    });

    it("should resolve tailwind conflicts (last wins)", () => {
      // p-4 and p-2 conflict; p-2 should win because it's last
      const result = cn("p-4", "p-2");
      expect(result).toBe("p-2");
    });

    it("should handle arrays and nested arrays", () => {
      const result = cn(["a", "b"], [["c"]]);
      expect(result).toBe("a b c");
    });

    it("should handle undefined and null", () => {
      const result = cn("a", undefined, null, "b");
      expect(result).toBe("a b");
    });
  });
});
