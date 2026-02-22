import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export class CartService {
  async getCart(sessionId: string) {
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    name: true,
                    price: true,
                    thumbnailUrl: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
        include: {
            items: {
                include: {
                    productVariant: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    price: true,
                                    thumbnailUrl: true
                                }
                            }
                        }
                    }
                }
            }
        },
      });
    }

    return cart;
  }

  async addItem(sessionId: string, variantId: string, quantity: number) {
    let cart = await prisma.cart.findUnique({
        where: { sessionId },
        select: { id: true }
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { sessionId },
            select: { id: true }
        });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId: variantId,
        },
      },
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    }

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productVariantId: variantId,
        quantity,
      },
    });
  }

  async updateItem(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(itemId: string) {
    return prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(sessionId: string) {
     const cart = await prisma.cart.findUnique({
        where: { sessionId },
        select: { id: true }
    });
    if (!cart) return;

    return prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
    });
  }
}

export const cartService = new CartService();
