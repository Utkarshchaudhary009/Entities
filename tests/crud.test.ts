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
  // Pre-generate all IDs so dependent tests don't cascade-fail
  const testSizeId = crypto.randomUUID();
  const testColorId = crypto.randomUUID();
  const testCategoryId = crypto.randomUUID();
  const testProductId = crypto.randomUUID();
  const testVariantId = crypto.randomUUID();
  const testCartId = crypto.randomUUID();
  const testCartItemId = crypto.randomUUID();
  const testOrderId = crypto.randomUUID();
  const testOrderItemId = crypto.randomUUID();
  const testDiscountId = crypto.randomUUID();

  afterAll(async () => {
    // Best-effort cleanup in reverse dependency order
    await supabase.from("order_items").delete().eq("order_id", testOrderId);
    await supabase.from("orders").delete().eq("id", testOrderId);
    await supabase.from("cart_items").delete().eq("cart_id", testCartId);
    await supabase.from("carts").delete().eq("id", testCartId);
    await supabase.from("discounts").delete().eq("id", testDiscountId);
    await supabase.from("product_variants").delete().eq("id", testVariantId);
    await supabase.from("products").delete().eq("id", testProductId);
    await supabase.from("categories").delete().eq("id", testCategoryId);
    await supabase.from("colors").delete().eq("id", testColorId);
    await supabase.from("sizes").delete().eq("id", testSizeId);
  });

  describe("Size CRUD", () => {
    test("Create Size", async () => {
      const { data, error } = await supabase
        .from("sizes")
        .insert({
          id: testSizeId,
          label: "TEST-M",
          sort_order: 1,
          measurements: { chest: { min: 36, max: 38, unit: "inches" } },
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(testSizeId);
      expect(data?.label).toBe("TEST-M");
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
      const { error } = await supabase.from("sizes").delete().eq("id", testSizeId);
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
        .insert({ id: testColorId, name: "Test Black", hex: "#000000", sort_order: 1 })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(testColorId);
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
      const { error } = await supabase.from("colors").delete().eq("id", testColorId);
      expect(error).toBeNull();
    });
  });

  describe("Category CRUD", () => {
    test("Create Category", async () => {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          id: testCategoryId,
          name: "Test Category",
          slug: "test-category-crud",
          about: "Test description",
          discount_percent: 10,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(testCategoryId);
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
          id: testProductId,
          name: "Test Product",
          slug: "test-product-crud",
          description: "A test product",
          price: 99900,
          compare_at_price: 129900,
          category_id: testCategoryId,
          is_featured: true,
          thumbnail_url: "https://example.com/image.jpg",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(testProductId);
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
          id: testVariantId,
          product_id: testProductId,
          size: "M",
          color: "Black",
          color_hex: "#000000",
          stock: 10,
          sku: "TEST-PROD-M-BLK-CRUD",
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(testVariantId);
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
          id: testCartId,
          session_id: `test-session-${testCartId}`,
          clerk_id: "test-user-123",
          customer_email: "test@example.com",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(testCartId);
    });

    test("Create CartItem", async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .insert({
          id: testCartItemId,
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
      const { error } = await supabase.from("carts").delete().eq("id", testCartId);
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
          id: testOrderId,
          order_number: `TEST-CRUD-${testOrderId.slice(0, 8)}`,
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
          status: "PENDING",
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(testOrderId);
    });

    test("Create OrderItem", async () => {
      const { data, error } = await supabase
        .from("order_items")
        .insert({
          id: testOrderItemId,
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
        .select("*, items:order_items(*)")
        .eq("id", testOrderId)
        .single();
      expect(error).toBeNull();
      expect(data?.items?.length).toBe(1);
      expect(data?.total).toBe(89900);
    });

    test("Update Order status", async () => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: "PROCESSING" })
        .eq("id", testOrderId)
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.status).toBe("PROCESSING");
    });

    test("Delete Order (cascades)", async () => {
      const { error } = await supabase.from("orders").delete().eq("id", testOrderId);
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
          id: testDiscountId,
          code: `TEST10-${testDiscountId.slice(0, 8)}`,
          description: "Test discount 10%",
          discount_type: "PERCENTAGE",
          value: 10,
          min_order_value: 50000,
          usage_limit: 100,
        })
        .select()
        .single();
      expect(error).toBeNull();
      expect(data?.id).toBe(testDiscountId);
    });

    test("Read Discount", async () => {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("id", testDiscountId)
        .single();
      expect(error).toBeNull();
      expect(data?.value).toBe(10);
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
      const { error } = await supabase.from("discounts").delete().eq("id", testDiscountId);
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
