import { describe, expect, test } from "bun:test";
import { orderQuerySchema } from "../src/lib/api/query-schemas";
import { handleError } from "../src/lib/api/response";
import { ForbiddenError } from "../src/lib/errors";

describe("handleError", () => {
  test("returns AppError status and payload", async () => {
    const res = handleError(new ForbiddenError("Nope"), "test");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "Nope", code: "FORBIDDEN" });
  });
});

describe("orderQuerySchema", () => {
  test("accepts lowercase status and normalizes", () => {
    const parsed = orderQuerySchema.parse({
      page: "1",
      limit: "20",
      status: "pending",
    });
    expect(parsed.status).toBe("PENDING");
  });

  test("rejects invalid status", () => {
    expect(() =>
      orderQuerySchema.parse({ page: "1", limit: "20", status: "nope" }),
    ).toThrow();
  });
});
