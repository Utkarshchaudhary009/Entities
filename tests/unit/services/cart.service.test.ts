import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { setupServiceModule } from "./service-test.utils";

// --- MOCK SETUP ---
// We need to support nested transactions
const mockPrisma = {
  cart: {
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
  },
  cartItem: {
    findUnique: mock(),
    create: mock(),
    update: mock(),
    delete: mock(),
    deleteMany: mock(),
    upsert: mock(),
  },
  productVariant: {
    findUnique: mock(),
  },
  $transaction: mock((callback) => callback(mockPrisma)),
  $queryRaw: mock(),
};

const { cartService } = await setupServiceModule<
  typeof import("@/services/cart.service")
>({
  serviceSourcePath: "../../../src/services/cart.service",
  prismaMock: mockPrisma,
});

describe("CartService", () => {
  beforeEach(() => {
    mockPrisma.cart.findUnique.mockReset();
    mockPrisma.cart.create.mockReset();
    mockPrisma.cart.update.mockReset();
    mockPrisma.cart.delete.mockReset();
    mockPrisma.cartItem.create.mockReset();
    mockPrisma.cartItem.update.mockReset();
    mockPrisma.cartItem.delete.mockReset();
    mockPrisma.productVariant.findUnique.mockReset();
    mockPrisma.$transaction.mockClear();
  });

  describe("getCart", () => {
    it("should return existing cart", async () => {
      // ARRANGE
      const mockCart = { id: "1", sessionId: "sess_1" };
      mockPrisma.cart.findUnique.mockResolvedValue(mockCart);

      // ACT
      const result = await cartService.getCart("sess_1");

      // ASSERT
      expect(result).toEqual(mockCart);
    });

    it("should create new cart if not found", async () => {
      // ARRANGE
      mockPrisma.cart.findUnique.mockResolvedValue(null);
      const newCart = { id: "2", sessionId: "sess_new" };
      mockPrisma.cart.create.mockResolvedValue(newCart);

      // ACT
      const result = await cartService.getCart("sess_new");

      // ASSERT
      expect(result).toEqual(newCart);
      expect(mockPrisma.cart.create).toHaveBeenCalled();
    });
  });

  describe("addItem", () => {
    it("should add item to cart", async () => {
      // ARRANGE
      const cart = { id: "c1", sessionId: "sess_1" };
      const variant = {
        id: "v1",
        stock: 10,
        isActive: true,
        product: { isActive: true },
      };

      // Mocks for transaction flow
      mockPrisma.cart.findUnique.mockResolvedValue(cart);
      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);
      mockPrisma.cartItem.findUnique.mockResolvedValue(null); // Item doesn't exist yet

      const createdItem = { id: "i1", quantity: 1 };
      mockPrisma.cartItem.create.mockResolvedValue(createdItem);

      // ACT
      const result = await cartService.addItem("sess_1", "v1", 1);

      // ASSERT
      expect(result).toEqual(createdItem);
      expect(mockPrisma.cartItem.create).toHaveBeenCalled();
    });
  });
});
