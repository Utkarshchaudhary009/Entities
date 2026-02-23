import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { OrderService } from "@/services/order.service";

// --- MOCK SETUP ---
// We create "spies" that we can control and inspect in our tests
const mockPrisma = {
  $transaction: mock((callback) => callback(mockPrisma)), // Flatten transaction
  $queryRaw: mock(),
  productVariant: {
    findUnique: mock(),
  },
  order: {
    create: mock(),
  },
};

// Replace the real Prisma client with our mock
mock.module("@/lib/prisma", () => ({
  default: mockPrisma,
}));

// Re-import the service AFTER mocking to ensure it uses the mock
const { orderService } = await import("@/services/order.service");

// --- TESTS ---
describe("OrderService", () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    mockPrisma.$queryRaw.mockReset();
    mockPrisma.productVariant.findUnique.mockReset();
    mockPrisma.order.create.mockReset();
  });

  describe("create", () => {
    // ARRANGE: Standard valid input data
    const validInput = {
      orderNumber: "ORD-123",
      clerkId: "user_test_123", // Auth is just a string here!
      customerName: "John Doe",
      whatsappNumber: "+1234567890",
      address: "123 St",
      city: "City",
      state: "State",
      pincode: "12345",
      subtotal: 100,
      total: 100,
      items: [
        {
          productVariantId: "variant_1",
          productName: "T-Shirt",
          size: "M",
          color: "Red",
          quantity: 2,
          unitPrice: 50,
          totalPrice: 100,
        },
      ],
    };

    it("should create an order successfully when stock is sufficient", async () => {
      // ARRANGE: Mock database behavior
      // 1. $queryRaw returns [] (meaning update succeeded, stock > 0)
      // Note: The service logic checks `if (updated.length === 0)` for FAILURE in the update query
      // WAIT: The service uses `RETURNING stock`. If update succeeds, it returns the new stock.
      // So [ { stock: 8 } ] means success. [] means failure (where clause `stock >= quantity` failed).
      mockPrisma.$queryRaw.mockResolvedValue([{ stock: 8 }]);

      // 2. Mock the order creation
      const mockOrder = { id: "order_1", ...validInput };
      mockPrisma.order.create.mockResolvedValue(mockOrder);

      // ACT
      const result = await orderService.create(validInput);

      // ASSERT
      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.create).toHaveBeenCalledTimes(1);
      // Verify transaction was called
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should throw ValidationError when stock is insufficient", async () => {
      // ARRANGE: Mock database failure
      // 1. Update returns empty array (meaning WHERE clause failed because stock < quantity)
      mockPrisma.$queryRaw.mockResolvedValue([]);

      // 2. Fallback check: findUnique returns current stock to show error
      mockPrisma.productVariant.findUnique.mockResolvedValue({ stock: 1 }); // User asked for 2

      // ACT & ASSERT
      try {
        await orderService.create(validInput);
      } catch (error: any) {
        expect(error.name).toBe("ValidationError");
        expect(error.message).toContain("Insufficient stock");
        expect(error.message).toContain("Available: 1");
      }

      // Verify order was NOT created
      expect(mockPrisma.order.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when product variant does not exist", async () => {
      // ARRANGE
      // 1. Update returns empty (failed)
      mockPrisma.$queryRaw.mockResolvedValue([]);
      // 2. Fallback check: findUnique returns null (variant deleted/missing)
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      try {
        await orderService.create(validInput);
      } catch (error: any) {
        expect(error.name).toBe("NotFoundError");
        expect(error.message).toContain("Product variant");
      }
    });

    it("should throw ValidationError when items array is empty", async () => {
      // ARRANGE
      const invalidInput = { ...validInput, items: [] };

      // ACT & ASSERT
      try {
        await orderService.create(invalidInput);
      } catch (error: any) {
        expect(error.name).toBe("ValidationError");
        expect(error.message).toBe("Order must have at least one item");
      }
    });
  });
});
