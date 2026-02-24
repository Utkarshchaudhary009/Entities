process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import prisma from "@/lib/prisma";

async function main() {
    console.log("Starting DB seed...");

    // Clean existing data in correct order to respect foreign keys
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    await prisma.brandDocument.deleteMany();
    await prisma.brandPhilosophy.deleteMany();
    await prisma.socialLink.deleteMany();
    await prisma.brand.deleteMany();
    await prisma.founder.deleteMany();

    await prisma.color.deleteMany();
    await prisma.size.deleteMany();
    await prisma.discount.deleteMany();

    console.log("Deleted old data.");

    // Constants
    const testFounderId = "user_2testfounder";

    // 1. Founder
    const founder = await prisma.founder.create({
        data: {
            id: testFounderId,
            name: "Alice Smith",
            age: 32,
            story: "Passionate about sustainable fashion.",
            education: "Design Institute",
            quote: "Fashion is how we walk into the world.",
            thumbnailUrl: "https://example.com/alice.jpg",
        }
    });

    // 2. Brand
    const brand = await prisma.brand.create({
        data: {
            name: "Entities",
            tagline: "Premium Sustainable Fashion",
            brandStory: "A brand born out of love for the planet.",
            supportEmail: "support@entities.co",
            supportPhone: "+1234567890",
            founderId: founder.id,
            philosophy: {
                create: {
                    mission: "To create clothes without harming the earth",
                    vision: "A green future",
                    values: ["Sustainability", "Quality", "Ethics"],
                    story: "Founded in 2024...",
                    heroImageUrl: "https://example.com/hero.jpg"
                }
            }
        }
    });

    console.log(`Created Brand: ${brand.name}`);

    // 3. Sizes and Colors
    const sizes = await Promise.all([
        prisma.size.create({ data: { label: "S", sortOrder: 1 } }),
        prisma.size.create({ data: { label: "M", sortOrder: 2 } }),
        prisma.size.create({ data: { label: "L", sortOrder: 3 } }),
    ]);

    const colors = await Promise.all([
        prisma.color.create({ data: { name: "Black", hex: "#000000", sortOrder: 1 } }),
        prisma.color.create({ data: { name: "White", hex: "#ffffff", sortOrder: 2 } }),
        prisma.color.create({ data: { name: "Olive", hex: "#808000", sortOrder: 3 } }),
    ]);

    // 4. Categories
    const categoryShirts = await prisma.category.create({
        data: { name: "Shirts", slug: "shirts", discountPercent: 0, sortOrder: 1 }
    });
    const categoryPants = await prisma.category.create({
        data: { name: "Pants", slug: "pants", discountPercent: 10, sortOrder: 2 }
    });

    // 5. Products & Variants
    const product1 = await prisma.product.create({
        data: {
            name: "Classic Linen Shirt",
            slug: "classic-linen-shirt",
            description: "Breathable summer shirt.",
            price: 4500,
            compareAtPrice: 5000,
            categoryId: categoryShirts.id,
            material: "Linen",
            fit: "Relaxed",
            isFeatured: true,
            variants: {
                create: [
                    { size: "M", color: "White", colorHex: "#ffffff", stock: 50, sku: "SHRT-LIN-M-WH" },
                    { size: "L", color: "White", colorHex: "#ffffff", stock: 30, sku: "SHRT-LIN-L-WH" },
                    { size: "M", color: "Black", colorHex: "#000000", stock: 20, sku: "SHRT-LIN-M-BK" },
                ]
            }
        },
        include: { variants: true }
    });

    const product2 = await prisma.product.create({
        data: {
            name: "Cargo Pants",
            slug: "cargo-pants",
            description: "Utility pants with multiple pockets.",
            price: 6500,
            categoryId: categoryPants.id,
            material: "Cotton Blend",
            fit: "Regular",
            variants: {
                create: [
                    { size: "M", color: "Olive", colorHex: "#808000", stock: 15, sku: "PANT-CAR-M-OL" },
                    { size: "L", color: "Olive", colorHex: "#808000", stock: 10, sku: "PANT-CAR-L-OL" },
                ]
            }
        },
        include: { variants: true }
    });

    console.log(`Created Products: ${product1.name}, ${product2.name}`);

    // 6. Discount
    await prisma.discount.create({
        data: {
            code: "WELCOME10",
            description: "10% off first order",
            discountType: "PERCENTAGE",
            value: 10,
            usageLimit: 100,
            isActive: true,
        }
    });

    // 7. Orders
    await prisma.order.create({
        data: {
            orderNumber: "ORD-1001",
            customerName: "Alice Wonder",
            whatsappNumber: "+1987654321",
            email: "alice@example.com",
            address: "123 Rabbit Hole",
            city: "Wonderland",
            state: "WL",
            pincode: "12345",
            subtotal: 4500,
            total: 4500,
            status: "DELIVERED",
            items: {
                create: [
                    {
                        productVariantId: product1.variants[0].id,
                        productName: product1.name,
                        size: product1.variants[0].size,
                        color: product1.variants[0].color,
                        quantity: 1,
                        unitPrice: product1.price,
                        totalPrice: product1.price,
                    }
                ]
            }
        }
    });

    await prisma.order.create({
        data: {
            orderNumber: "ORD-1002",
            customerName: "Bob Builder",
            whatsappNumber: "+1122334455",
            email: "bob@example.com",
            address: "456 Construction Site",
            city: "Builder Town",
            state: "BT",
            pincode: "54321",
            subtotal: 11000,
            total: 11000,
            status: "PENDING",
            items: {
                create: [
                    {
                        productVariantId: product1.variants[1].id,
                        productName: product1.name,
                        size: product1.variants[1].size,
                        color: product1.variants[1].color,
                        quantity: 1,
                        unitPrice: product1.price,
                        totalPrice: product1.price,
                    },
                    {
                        productVariantId: product2.variants[0].id,
                        productName: product2.name,
                        size: product2.variants[0].size,
                        color: product2.variants[0].color,
                        quantity: 1,
                        unitPrice: product2.price,
                        totalPrice: product2.price,
                    }
                ]
            }
        }
    });

    console.log("DB seed finished successfully.");
}

main()
    .catch((e) => {
        console.error("Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
