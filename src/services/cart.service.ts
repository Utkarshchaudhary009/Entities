import {
  ForbiddenError,
  handlePrismaError,
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import prisma from "@/lib/prisma";

export class CartService {
  private validateCartOwnership(
    cartClerkId: string | null,
    requestClerkId?: string,
  ): void {
    if (requestClerkId && cartClerkId && cartClerkId !== requestClerkId) {
      throw new ForbiddenError("You do not have access to this cart");
    }
  }

  async getCart(sessionId: string, clerkId?: string) {
    try {
      let cart = await prisma.cart.findUnique({
        where: { sessionId },
        select: {
          id: true,
          sessionId: true,
          clerkId: true,
          customerEmail: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
          items: true,
        },
      });

      if (cart) this.validateCartOwnership(cart.clerkId, clerkId);

      if (cart && clerkId && !cart.clerkId) {
        cart = await prisma.cart.update({
          where: { id: cart.id },
          data: { clerkId },
          select: {
            id: true,
            sessionId: true,
            clerkId: true,
            customerEmail: true,
            createdAt: true,
            updatedAt: true,
            expiresAt: true,
            items: true,
          },
        });
      }

      if (!cart) {
        cart = await prisma.cart.create({
          data: { sessionId, clerkId },
          select: {
            id: true,
            sessionId: true,
            clerkId: true,
            customerEmail: true,
            createdAt: true,
            updatedAt: true,
            expiresAt: true,
            items: true,
          },
        });
      }

      return cart;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async getCartWithDetails(sessionId: string, clerkId?: string) {
    try {
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
                      thumbnailUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (cart) this.validateCartOwnership(cart.clerkId, clerkId);

      if (cart && clerkId && !cart.clerkId) {
        cart = await prisma.cart.update({
          where: { id: cart.id },
          data: { clerkId },
          include: {
            items: {
              include: {
                productVariant: {
                  include: {
                    product: {
                      select: {
                        name: true,
                        price: true,
                        thumbnailUrl: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        });
      }

      if (!cart) {
        cart = await prisma.cart.create({
          data: { sessionId, clerkId },
          include: {
            items: {
              include: {
                productVariant: {
                  include: {
                    product: {
                      select: {
                        name: true,
                        price: true,
                        thumbnailUrl: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        });
      }

      return cart;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async addItem(
    sessionId: string,
    variantId: string,
    quantity: number,
    clerkId?: string,
  ) {
    try {
      if (quantity <= 0) {
        throw new ValidationError("Quantity must be positive");
      }

      const result = await prisma.$transaction(async (tx) => {
        // Serialize add-to-cart operations per-variant to avoid overselling under concurrency.
        await tx.$queryRaw`
          SELECT id
          FROM "product_variants"
          WHERE id = ${variantId}
          FOR UPDATE
        `;

        let cart = await tx.cart.findUnique({
          where: { sessionId },
          select: { id: true, clerkId: true },
        });

        if (!cart) {
          cart = await tx.cart.create({
            data: { sessionId, clerkId },
            select: { id: true, clerkId: true },
          });
        }

        this.validateCartOwnership(cart.clerkId, clerkId);

        if (clerkId && !cart.clerkId) {
          cart = await tx.cart.update({
            where: { id: cart.id },
            data: { clerkId },
            select: { id: true, clerkId: true },
          });
        }

        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: {
            stock: true,
            isActive: true,
            product: { select: { isActive: true } },
          },
        });

        if (!variant) {
          throw new NotFoundError("Product variant", variantId);
        }

        if (!variant.isActive || !variant.product.isActive) {
          throw new ValidationError("This product variant is not available");
        }

        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_productVariantId: {
              cartId: cart.id,
              productVariantId: variantId,
            },
          },
        });

        const totalQuantity = (existingItem?.quantity ?? 0) + quantity;

        if (variant.stock < totalQuantity) {
          throw new InsufficientStockError(variant.stock, totalQuantity);
        }

        if (existingItem) {
          return tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: totalQuantity },
            include: {
              productVariant: {
                include: {
                  product: {
                    select: { name: true, price: true, thumbnailUrl: true },
                  },
                },
              },
            },
          });
        }

        return tx.cartItem.create({
          data: {
            cartId: cart.id,
            productVariantId: variantId,
            quantity,
          },
          include: {
            productVariant: {
              include: {
                product: {
                  select: { name: true, price: true, thumbnailUrl: true },
                },
              },
            },
          },
        });
      });

      return result;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async updateItem(itemId: string, quantity: number, clerkId?: string) {
    try {
      if (quantity <= 0) {
        return await this.removeItem(itemId, clerkId);
      }

      return await prisma.$transaction(async (tx) => {
        const item = await tx.cartItem.findUnique({
          where: { id: itemId },
          include: {
            cart: { select: { clerkId: true } },
            productVariant: {
              select: { stock: true, id: true },
            },
          },
        });

        if (!item) {
          throw new NotFoundError("Cart item", itemId);
        }

        this.validateCartOwnership(item.cart.clerkId, clerkId);

        // Lock the variant row to prevent race conditions
        await tx.$queryRaw`
          SELECT id FROM "product_variants"
          WHERE id = ${item.productVariant.id}
          FOR UPDATE
        `;

        const variant = await tx.productVariant.findUnique({
          where: { id: item.productVariant.id },
          select: { stock: true },
        });

        if (!variant || variant.stock < quantity) {
          throw new InsufficientStockError(variant?.stock ?? 0, quantity);
        }

        return tx.cartItem.update({
          where: { id: itemId },
          data: { quantity },
          include: {
            productVariant: {
              include: {
                product: {
                  select: { name: true, price: true, thumbnailUrl: true },
                },
              },
            },
          },
        });
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async removeItem(itemId: string, clerkId?: string) {
    try {
      if (clerkId) {
        const item = await prisma.cartItem.findUnique({
          where: { id: itemId },
          include: { cart: { select: { clerkId: true } } },
        });

        if (!item) {
          throw new NotFoundError("Cart item", itemId);
        }

        this.validateCartOwnership(item.cart.clerkId, clerkId);
      }

      const item = await prisma.cartItem.delete({
        where: { id: itemId },
      });

      return item;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async clearCart(sessionId: string, clerkId?: string) {
    try {
      const cart = await prisma.cart.findUnique({
        where: { sessionId },
        select: { id: true, clerkId: true },
      });

      if (!cart) return;

      this.validateCartOwnership(cart.clerkId, clerkId);

      return prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async getCartSummary(sessionId: string, clerkId?: string) {
    try {
      const cart = await this.getCartWithDetails(sessionId, clerkId);
      if (!cart) {
        return {
          items: [],
          subtotal: 0,
          itemCount: 0,
        };
      }

      const items = cart.items.map((item) => ({
        id: item.id,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        productName: item.productVariant.product.name,
        productPrice: item.productVariant.product.price,
        productImage: item.productVariant.product.thumbnailUrl,
        size: item.productVariant.size,
        color: item.productVariant.color,
        stock: item.productVariant.stock,
        subtotal: item.productVariant.product.price * item.quantity,
      }));

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items,
        subtotal,
        itemCount,
      };
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const cartService = new CartService();
