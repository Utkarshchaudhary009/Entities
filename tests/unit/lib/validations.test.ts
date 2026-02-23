import { describe, expect, it } from "bun:test";
import { createBrandSchema } from "@/lib/validations/brand";
import { createBrandDocumentSchema } from "@/lib/validations/brand-document";
import { addToCartSchema } from "@/lib/validations/cart";
import { createCategorySchema } from "@/lib/validations/category";
import { createColorSchema } from "@/lib/validations/color";
import { createDiscountSchema } from "@/lib/validations/discount";
import { createFounderSchema } from "@/lib/validations/founder";
import { createOrderSchema } from "@/lib/validations/order";
import { createProductSchema } from "@/lib/validations/product";
import { createSizeSchema } from "@/lib/validations/size";
import { createSocialLinkSchema } from "@/lib/validations/social-link";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("Validations", () => {
  describe("Brand Schema", () => {
    it("should validate correct brand input", () => {
      const input = {
        name: "Nike",
        founderId: VALID_UUID,
        logoUrl: "https://example.com/logo.png",
        supportEmail: "support@nike.com",
      };
      const result = createBrandSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should fail on invalid email", () => {
      const input = {
        name: "Nike",
        founderId: VALID_UUID,
        supportEmail: "invalid-email",
      };
      const result = createBrandSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Order Schema", () => {
    it("should validate correct order input", () => {
      const input = {
        customerName: "John Doe",
        whatsappNumber: "+1234567890",
        address: "123 St",
        city: "City",
        state: "State",
        pincode: "12345",
        sessionId: "sess_123",
      };
      const result = createOrderSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should fail on short address", () => {
      const input = {
        customerName: "John",
        whatsappNumber: "+1234567890",
        address: "12",
        city: "C",
        state: "S",
        pincode: "12345",
        sessionId: "sess_1",
      };
      const result = createOrderSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Discount Schema", () => {
    it("should validate correct discount input", () => {
      const input = {
        code: "SALE20",
        value: 20,
        discountType: "PERCENTAGE",
        minOrderValue: 100,
      };
      const result = createDiscountSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should fail on negative value", () => {
      const input = {
        code: "SALE20",
        value: -10,
      };
      const result = createDiscountSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Product Schema", () => {
    it("should validate correct product input", () => {
      const input = {
        name: "Shoes",
        slug: "shoes-123",
        price: 100,
        categoryId: VALID_UUID,
        description: "Nice shoes",
      };
      const result = createProductSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should fail on negative price", () => {
      const input = {
        name: "Shoes",
        slug: "shoes",
        price: -100,
        categoryId: VALID_UUID,
      };
      const result = createProductSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("SocialLink Schema", () => {
    it("should validate correct input with brandId", () => {
      const input = {
        platform: "Twitter",
        url: "https://twitter.com",
        brandId: VALID_UUID,
      };
      const result = createSocialLinkSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should fail when both brandId and founderId are missing", () => {
      const input = {
        platform: "Twitter",
        url: "https://twitter.com",
      };
      const result = createSocialLinkSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Category Schema", () => {
    it("should validate correct category", () => {
      const input = { name: "Tops", slug: "tops", discountPercent: 10 };
      const result = createCategorySchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Size Schema", () => {
    it("should validate correct size", () => {
      const input = { label: "XL", sortOrder: 1 };
      const result = createSizeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Color Schema", () => {
    it("should validate correct color", () => {
      const input = { name: "Red", hex: "#FF0000" };
      const result = createColorSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Founder Schema", () => {
    it("should validate correct founder", () => {
      const input = { name: "Steve", age: 50 };
      const result = createFounderSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("BrandDocument Schema", () => {
    it("should validate correct document", () => {
      const input = {
        type: "PRIVACY_POLICY",
        content: "Legal text...",
        brandId: VALID_UUID,
      };
      const result = createBrandDocumentSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Cart Schema", () => {
    it("should validate correct add-to-cart input", () => {
      const input = {
        productVariantId: VALID_UUID,
        quantity: 1,
      };
      const result = addToCartSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should fail on invalid quantity", () => {
      const input = {
        productVariantId: VALID_UUID,
        quantity: 0,
      };
      const result = addToCartSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
