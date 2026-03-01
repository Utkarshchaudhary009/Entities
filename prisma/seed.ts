import type { OrderStatus } from "@/generated/prisma/client";
import { VALID_COLORS, VALID_SIZES } from "@/lib/constants/product-options";
import prisma from "@/lib/prisma";

const SEED_TAG = "SEED::ENTITIES";
const SEED_DOMAIN = "seed.entities.local";
const SEED_CATEGORY_SLUG_PREFIX = "seed-entities";
const SEED_ORDER_PREFIX = `${SEED_TAG}-ORD-`;
const SEED_DISCOUNT_PREFIX = `${SEED_TAG}-PROMO-`;
const SEED_SESSION_PREFIX = `${SEED_TAG}:session:`;
const SEED_CLERK_PREFIX = `${SEED_TAG}:clerk:`;
const _SEED_SIZE_PREFIX = `${SEED_TAG}-SIZE-`;
const _SEED_COLOR_PREFIX = `${SEED_TAG}-COLOR-`;
const SEED_SKU_PREFIX = `${SEED_TAG}-SKU-`;

function seededEmail(localPart: string) {
  return `${localPart}@${SEED_DOMAIN}`;
}

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length) as number];
}

class ProgressBar {
  private current = 0;
  private total: number;
  private label: string;
  private width: number;

  constructor(label: string, total: number, width = 30) {
    this.label = label;
    this.total = total;
    this.width = width;
  }

  tick(step = 1) {
    this.current += step;
    this.render();
  }

  private render() {
    const percent = Math.min(this.current / this.total, 1);
    const filled = Math.round(percent * this.width);
    const empty = this.width - filled;
    const bar = `[${"X".repeat(filled)}${".".repeat(empty)}]`;
    process.stdout.write(
      `\r${this.label} ${bar} ${this.current}/${this.total}`,
    );
  }

  done() {
    process.stdout.write("\n");
  }
}

function getDbTargetInfo() {
  const connectionString =
    process.env.SUPABASE_POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_POSTGRES_URL;

  if (!connectionString) {
    return "DBTarget: missing database URL env";
  }

  try {
    const parsed = new URL(connectionString);
    const protocol = parsed.protocol.replace(":", "");
    const host = parsed.hostname || "unknown-host";
    const port = parsed.port || "default";
    const sslmode = parsed.searchParams.get("sslmode") || "not-set";
    const libpqCompat = parsed.searchParams.get("uselibpqcompat") || "false";

    return `DBTarget: protocol=${protocol} host=${host} port=${port} sslmode=${sslmode} uselibpqcompat=${libpqCompat}`;
  } catch {
    return "DBTarget: invalid database URL format";
  }
}

async function cleanSeedData() {
  console.log("Cleaning seed/test data only...");

  const orderWhere = {
    OR: [
      { orderNumber: { startsWith: SEED_ORDER_PREFIX } },
      { clerkId: { startsWith: SEED_CLERK_PREFIX } },
      { email: { endsWith: SEED_DOMAIN } },
      { customerName: { startsWith: SEED_TAG } },
    ],
  };

  await prisma.orderItem.deleteMany({ where: { order: { is: orderWhere } } });
  await prisma.order.deleteMany({ where: orderWhere });

  const seededCarts = await prisma.cart.findMany({
    where: {
      OR: [
        { sessionId: { startsWith: SEED_SESSION_PREFIX } },
        { clerkId: { startsWith: SEED_CLERK_PREFIX } },
        { customerEmail: { endsWith: SEED_DOMAIN } },
      ],
    },
    select: { id: true },
  });

  if (seededCarts.length > 0) {
    const cartIds = seededCarts.map((cart) => cart.id);
    await prisma.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
    await prisma.cart.deleteMany({ where: { id: { in: cartIds } } });
  }

  await prisma.productVariant.deleteMany({
    where: {
      OR: [
        { sku: { startsWith: SEED_SKU_PREFIX } },
        { product: { is: { name: { startsWith: SEED_TAG } } } },
      ],
    },
  });

  await prisma.product.deleteMany({
    where: {
      OR: [
        { name: { startsWith: SEED_TAG } },
        { slug: { startsWith: SEED_CATEGORY_SLUG_PREFIX } },
      ],
    },
  });

  await prisma.category.deleteMany({
    where: {
      OR: [
        { name: { startsWith: SEED_TAG } },
        { slug: { startsWith: SEED_CATEGORY_SLUG_PREFIX } },
      ],
    },
  });

  await prisma.brandDocument.deleteMany({
    where: {
      OR: [
        { content: { contains: SEED_TAG } },
        { brand: { is: { name: { startsWith: SEED_TAG } } } },
      ],
    },
  });

  await prisma.brandPhilosophy.deleteMany({
    where: { brand: { is: { name: { startsWith: SEED_TAG } } } },
  });

  await prisma.socialLink.deleteMany({
    where: {
      OR: [
        { url: { contains: "seed.entities.local" } },
        { brand: { is: { name: { startsWith: SEED_TAG } } } },
        { founder: { is: { id: { startsWith: SEED_TAG } } } },
      ],
    },
  });

  await prisma.brand.deleteMany({ where: { name: { startsWith: SEED_TAG } } });
  await prisma.founder.deleteMany({ where: { id: { startsWith: SEED_TAG } } });

  await prisma.discount.deleteMany({
    where: { code: { startsWith: SEED_DISCOUNT_PREFIX } },
  });

  console.log("Finished cleaning seed/test data.");
}

async function seedCatalogData() {
  const founder = await prisma.founder.create({
    data: {
      id: `${SEED_TAG}:founder:alice`,
      name: `${SEED_TAG} Alice Smith`,
      age: 32,
      story: "Seed founder profile for testing brand and admin pages.",
      education: "Seed Design Institute",
      quote: "Seeded fashion data for functional testing.",
      thumbnailUrl: "https://example.com/seed-alice.jpg",
      socialLinks: {
        create: [
          {
            platform: "Twitter",
            url: "https://seed.entities.local/alice-twitter",
          },
          {
            platform: "Instagram",
            url: "https://seed.entities.local/alice-instagram",
          },
        ],
      },
    },
  });

  await prisma.brand.create({
    data: {
      name: `${SEED_TAG} Entities`,
      tagline: "Seeded Sustainable Fashion",
      brandStory: "Seed brand story for integration and UI tests.",
      supportEmail: seededEmail("support"),
      supportPhone: "+19990000000",
      founderId: founder.id,
      philosophy: {
        create: {
          mission: "Seed mission for predictable UI rendering.",
          vision: "Seed vision for test scenarios.",
          values: ["Seed", "Quality", "Consistency"],
          story: `${SEED_TAG} brand philosophy for automated tests.`,
          heroImageUrl: "https://example.com/seed-hero.jpg",
        },
      },
      documents: {
        create: [
          {
            type: "RETURN_POLICY",
            content: `${SEED_TAG} return policy content.`,
          },
          {
            type: "SHIPPING_POLICY",
            content: `${SEED_TAG} shipping policy content.`,
          },
          {
            type: "REFUND_POLICY",
            content: `${SEED_TAG} refund policy content.`,
          },
          {
            type: "PRIVACY_POLICY",
            content: `${SEED_TAG} privacy policy content.`,
          },
          {
            type: "TERMS_AND_CONDITIONS",
            content: `${SEED_TAG} terms content.`,
          },
        ],
      },
      socialLinks: {
        create: [
          {
            platform: "LinkedIn",
            url: "https://seed.entities.local/brand-linkedin",
          },
          {
            platform: "YouTube",
            url: "https://seed.entities.local/brand-youtube",
          },
        ],
      },
    },
  });

  const sizes = VALID_SIZES.map((label) => ({ label }));

  const colors = VALID_COLORS.map((name) => ({ name }));

  const categoryNames = [
    "Shirts",
    "Pants",
    "Jackets",
    "T-Shirts",
    "Accessories",
    "Dresses",
    "Activewear",
    "Loungewear",
  ];

  const categories = await Promise.all(
    categoryNames.map((name, index) =>
      prisma.category.create({
        data: {
          name: `${SEED_TAG} ${name}`,
          slug: `${SEED_CATEGORY_SLUG_PREFIX}-${name.toLowerCase().replace(/ /g, "-")}`,
          discountPercent: index % 3 === 0 ? 10 : 0,
          sortOrder: index + 1,
          thumbnailUrl: `https://example.com/seed-category-${name.toLowerCase()}.jpg`,
          about: `${SEED_TAG} category ${name.toLowerCase()} for table and card tests.`,
        },
      }),
    ),
  );

  const styles = [
    "Classic",
    "Modern",
    "Essential",
    "Premium",
    "Vintage",
    "Signature",
  ];
  const materials = [
    "Cotton",
    "Linen",
    "Wool Blend",
    "Silk",
    "Recycled Polyester",
    "Denim",
  ];
  const fits = ["Regular", "Slim", "Relaxed", "Oversized", "Athletic"];

  const products = [] as Array<{
    id: string;
    price: number;
    name: string;
    thumbnailUrl: string | null;
    variants: Array<{
      id: string;
      size: string;
      color: string;
      images: string[];
    }>;
  }>;

  const totalProducts = categories.length * 6;
  const productProgress = new ProgressBar("Products", totalProducts);

  for (let c = 0; c < categories.length; c++) {
    const category = categories[c];

    for (let p = 1; p <= 6; p++) {
      const style = randomFrom(styles);
      const material = randomFrom(materials);
      const fit = randomFrom(fits);
      const name = `${SEED_TAG} ${style} ${categoryNames[c].replace(/s$/, "")} ${p}`;
      const basePrice = Math.floor(Math.random() * 5000) + 1500;

      const productColors = [...colors]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const productSizes = [...sizes]
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);

      let variantIndex = 0;
      const variants = productColors.flatMap((color) =>
        productSizes.map((size) => {
          variantIndex++;
          return {
            size: size.label,
            color: color.name,

            stock: Math.floor(Math.random() * 50) + 10,
            sku: `${SEED_SKU_PREFIX}C${c + 1}P${p}V${variantIndex}`,
            images: [
              `https://example.com/seed-products/${category.slug}-${p}-${color.name}-1.jpg`,
              `https://example.com/seed-products/${category.slug}-${p}-${color.name}-2.jpg`,
            ],
          };
        }),
      );

      const product = await prisma.product.create({
        data: {
          name,
          slug: `${SEED_CATEGORY_SLUG_PREFIX}-${c + 1}-${p}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          description: `${SEED_TAG} product made with ${material}.`,
          price: basePrice,
          compareAtPrice: basePrice + Math.floor(Math.random() * 1000) + 300,
          categoryId: category.id,
          material,
          fit,
          fabric: `${Math.floor(Math.random() * 100)}% ${material}`,
          careInstruction: "Machine wash cold, tumble dry low.",
          defaultColor: productColors[0].name,
          defaultSize: productSizes[0].label,
          isFeatured: p <= 2,
          thumbnailUrl: `https://example.com/seed-products/thumb-${category.slug}-${p}.jpg`,
          variants: { create: variants },
        },
        include: { variants: true },
      });

      products.push(product);
      productProgress.tick();
    }
  }
  productProgress.done();

  const discountTypes = ["PERCENTAGE", "FIXED", "BOGO"] as const;
  for (let i = 1; i <= 12; i++) {
    const type = discountTypes[i % 3];
    await prisma.discount.create({
      data: {
        code: `${SEED_DISCOUNT_PREFIX}${i}`,
        description: `${SEED_TAG} ${type} discount for testing checkout behavior.`,
        discountType: type,
        value: type === "PERCENTAGE" ? 15 : type === "FIXED" ? 500 : 0,
        minOrderValue: 2000,
        usageLimit: 500,
        isActive: i <= 8,
        startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });
  }

  const statuses: OrderStatus[] = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  const orderProgress = new ProgressBar("Orders", 100);

  for (let i = 1; i <= 100; i++) {
    const status = randomFrom(statuses);
    const itemCount = Math.floor(Math.random() * 4) + 1;

    const items: Array<{
      productVariantId: string;
      productName: string;
      productImage: string | null;
      size: string;
      color: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const product = randomFrom(products);
      const variant = randomFrom(product.variants);
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalPrice = product.price * quantity;
      subtotal += totalPrice;

      items.push({
        productVariantId: variant.id,
        productName: product.name,
        productImage: variant.images[0] || product.thumbnailUrl,
        size: variant.size,
        color: variant.color,
        quantity,
        unitPrice: product.price,
        totalPrice,
      });
    }

    const discountAmount = Math.random() > 0.5 ? 500 : 0;
    const shippingCost = subtotal > 5000 ? 0 : 200;

    await prisma.order.create({
      data: {
        orderNumber: `${SEED_ORDER_PREFIX}${2000 + i}`,
        clerkId: `${SEED_CLERK_PREFIX}${i}`,
        customerName: `${SEED_TAG} Customer ${i}`,
        whatsappNumber: `+1000000${i.toString().padStart(4, "0")}`,
        email: seededEmail(`customer${i}`),
        address: `${i} Seed Testing Street`,
        city: "Seedville",
        state: "SD",
        pincode: Math.floor(10000 + Math.random() * 90000).toString(),
        subtotal,
        discountCode: discountAmount > 0 ? `${SEED_DISCOUNT_PREFIX}1` : null,
        discountAmount,
        shippingCost,
        total: subtotal - discountAmount + shippingCost,
        status,
        notes: i % 10 === 0 ? `${SEED_TAG} deliver on weekends only.` : null,
        adminNotes: i % 7 === 0 ? `${SEED_TAG} admin note.` : null,
        createdAt: new Date(
          Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 115),
        ),
        items: { create: items },
      },
    });
    orderProgress.tick();
  }
  orderProgress.done();

  const cartProgress = new ProgressBar("Carts", 20);

  for (let i = 1; i <= 20; i++) {
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const cartItems = [] as Array<{
      productVariantId: string;
      quantity: number;
    }>;

    for (let j = 0; j < itemCount; j++) {
      const product = randomFrom(products);
      const variant = randomFrom(product.variants);
      cartItems.push({
        productVariantId: variant.id,
        quantity: Math.floor(Math.random() * 3) + 1,
      });
    }

    await prisma.cart.create({
      data: {
        sessionId: `${SEED_SESSION_PREFIX}${i}`,
        clerkId: i % 2 === 0 ? `${SEED_CLERK_PREFIX}cart-${i}` : null,
        customerEmail: seededEmail(`cart${i}`),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        items: {
          create: cartItems,
        },
      },
    });
    cartProgress.tick();
  }
  cartProgress.done();

  console.log("Seed data created successfully.");
}

async function main() {
  const isCleanOnly = process.argv.includes("--clean");

  await cleanSeedData();

  if (isCleanOnly) {
    console.log("Clean-only mode complete.");
    return;
  }

  console.log("Starting database seed...");
  await seedCatalogData();
  console.log("Database seed completed.");
}

main()
  .catch((error: unknown) => {
    console.log(error);
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "N/A";

    console.error("Error seeding database. Check seed diagnostics below.");
    console.error(`SeedErrorName: ${errorName}`);
    console.error(`SeedErrorCode: ${errorCode}`);
    console.error(getDbTargetInfo());
    console.error(
      "Validate database connectivity, SSL configuration, and required environment variables.",
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
