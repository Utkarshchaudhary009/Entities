import { afterAll, describe, expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

describe("Database CRUD Tests", () => {
  let testCategoryId: string;
  let testProductId: string;
  let testVariantId: string;
  let testSizeId: string;
  let testColorId: string;
  let testCartId: string;
  let testOrderId: string;
  let testDiscountId: string;

  afterAll(async () => {});

  describe("Size CRUD", () => {
    test("Create Size", async () => {
      const { data, error } = await supabase
        .from("sizes")
        .insert({
          label: "TEST-M",
          sort_order: 1,
          measurements: { chest: { min: 36, max: 38, unit: "inches" } },
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      expect(data?.label).toBe("TEST-M");
      testSizeId = data?.id;
    });

    test("Read Size", async () => {
      const { data, error } = await supabase
        .from("sizes")
        .select("*")
        .eq("id", testSizeId)
        .single();
      expect(error).toBeNull();
      expect(data?.label).toBe("TEST-M");
    });

    test("Update Size", async () => {
      const { data, error } = await supabase
        .from("sizes")
        .update({ sort_order: 5 })
        .eq("id", testSizeId)
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.sort_order).toBe(5);
    });

    test("Delete Size", async () => {
      const { error } = await supabase
        .from("sizes")
        .delete()
        .eq("id", testSizeId);
      expect(error).toBeNull();
      const { data } = await supabase
        .from("sizes")
        .select("*")
        .eq("id", testSizeId)
        .single();
      expect(data).toBeNull();
    });
  });

  describe("Color CRUD", () => {
    test("Create Color", async () => {
      const { data, error } = await supabase
        .from("colors")
        .insert({ name: "Test Black", hex: "#000000", sort_order: 1 })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      testColorId = data?.id;
    });

    test("Read Color", async () => {
      const { data, error } = await supabase
        .from("colors")
        .select("*")
        .eq("id", testColorId)
        .single();
      expect(error).toBeNull();
      expect(data?.name).toBe("Test Black");
    });

    test("Delete Color", async () => {
      const { error } = await supabase
        .from("colors")
        .delete()
        .eq("id", testColorId);
      expect(error).toBeNull();
    });
  });

  describe("Category CRUD", () => {
    test("Create Category", async () => {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: "Test Category",
          slug: "test-category",
          about: "Test description",
          discount_percent: 10,
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      testCategoryId = data?.id;
    });

    test("Read Category", async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", testCategoryId)
        .single();
      expect(error).toBeNull();
      expect(data?.name).toBe("Test Category");
    });

    test("Update Category", async () => {
      const { data, error } = await supabase
        .from("categories")
        .update({ discount_percent: 15 })
        .eq("id", testCategoryId)
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.discount_percent).toBe(15);
    });
  });

  describe("Product CRUD", () => {
    test("Create Product", async () => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: "Test Product",
          slug: "test-product",
          description: "A test product",
          price: 99900,
          compare_at_price: 129900,
          category_id: testCategoryId,
          is_featured: true,
          images: ["https://example.com/image.jpg"],
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      testProductId = data?.id;
    });

    test("Read Product with Category", async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*)")
        .eq("id", testProductId)
        .single();
      expect(error).toBeNull();
      expect(data?.name).toBe("Test Product");
      expect(data?.category?.name).toBe("Test Category");
    });

    test("Update Product", async () => {
      const { data, error } = await supabase
        .from("products")
        .update({ price: 89900 })
        .eq("id", testProductId)
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.price).toBe(89900);
    });
  });

  describe("ProductVariant CRUD", () => {
    test("Create ProductVariant", async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .insert({
          product_id: testProductId,
          size: "M",
          color: "Black",
          color_hex: "#000000",
          stock: 10,
          sku: "TEST-PROD-M-BLK",
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      testVariantId = data?.id;
    });

    test("Read ProductVariant", async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("id", testVariantId)
        .single();
      expect(error).toBeNull();
      expect(data?.stock).toBe(10);
    });

    test("Update ProductVariant stock", async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .update({ stock: 5 })
        .eq("id", testVariantId)
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.stock).toBe(5);
    });
  });

  describe("Cart and CartItem CRUD", () => {
    test("Create Cart", async () => {
      const { data, error } = await supabase
        .from("carts")
        .insert({
          session_id: "test-session-123",
          user_id: "test-user-123",
          customer_email: "test@example.com",
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      testCartId = data?.id;
    });

    test("Create CartItem", async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .insert({
          cart_id: testCartId,
          product_variant_id: testVariantId,
          quantity: 2,
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
    });

    test("Read Cart with Items", async () => {
      const { data, error } = await supabase
        .from("carts")
        .select("*, items:cart_items(*, product_variant:product_variants(*))")
        .eq("id", testCartId)
        .single();
      expect(error).toBeNull();
      expect(data?.items?.length).toBe(1);
      expect(data?.items?.[0]?.quantity).toBe(2);
    });

    test("Delete Cart (cascades to cart items)", async () => {
      const { error } = await supabase
        .from("carts")
        .delete()
        .eq("id", testCartId);
      expect(error).toBeNull();
      const { data } = await supabase
        .from("cart_items")
        .select("*")
        .eq("cart_id", testCartId);
      expect(data?.length).toBe(0);
    });
  });

  describe("Order and OrderItem CRUD", () => {
    test("Create Order", async () => {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_number: "TEST-2026-02-0001",
          customer_name: "Test Customer",
          whatsapp_number: "+1234567890",
          email: "customer@test.com",
          address: "123 Test St",
          city: "Test City",
          state: "Test State",
          pincode: "12345",
          subtotal: 89900,
          discount_amount: 5000,
          shipping_cost: 5000,
          total: 89900,
          status: "pending",
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      testOrderId = data?.id;
    });

    test("Create OrderItem", async () => {
      const { data, error } = await supabase
        .from("order_items")
        .insert({
          order_id: testOrderId,
          product_variant_id: testVariantId,
          product_name: "Test Product",
          product_image: "https://example.com/image.jpg",
          size: "M",
          color: "Black",
          quantity: 1,
          unit_price: 89900,
          total_price: 89900,
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
    });

    test("Read Order with Items", async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*))")
        .eq("id", testOrderId)
        .single();
      expect(error).toBeNull();
      expect(data?.items?.length).toBe(1);
      expect(data?.total).toBe(89900);
    });

    test("Update Order status", async () => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", testOrderId)
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.status).toBe("confirmed");
    });

    test("Delete Order (cascades)", async () => {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", testOrderId);
      expect(error).toBeNull();
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", testOrderId);
      expect(data?.length).toBe(0);
    });
  });

  describe("Discount CRUD", () => {
    test("Create Discount", async () => {
      const { data, error } = await supabase
        .from("discounts")
        .insert({
          code: "TEST10",
          description: "Test discount 10%",
          discount_type: "percentage",
          value: 10,
          min_order_value: 50000,
          usage_limit: 100,
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      testDiscountId = data?.id;
    });

    test("Read Discount", async () => {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("id", testDiscountId)
        .single();
      expect(error).toBeNull();
      expect(data?.code).toBe("TEST10");
    });

    test("Update Discount usage_count", async () => {
      const { data, error } = await supabase
        .from("discounts")
        .update({ usage_count: 5 })
        .eq("id", testDiscountId)
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.usage_count).toBe(5);
    });

    test("Delete Discount", async () => {
      const { error } = await supabase
        .from("discounts")
        .delete()
        .eq("id", testDiscountId);
      expect(error).toBeNull();
    });
  });

  describe("Cleanup", () => {
    test("Delete ProductVariant", async () => {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", testVariantId);
      expect(error).toBeNull();
    });

    test("Delete Product", async () => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", testProductId);
      expect(error).toBeNull();
    });

    test("Delete Category", async () => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", testCategoryId);
      expect(error).toBeNull();
    });
  });
});
