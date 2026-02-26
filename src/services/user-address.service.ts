import type { Prisma } from "@/generated/prisma/client";
import { handlePrismaError, NotFoundError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class UserAddressService {
  async getAddresses(clerkId: string) {
    try {
      return await prisma.userAddress.findMany({
        where: { clerkId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async getAddress(id: string, clerkId: string) {
    try {
      const address = await prisma.userAddress.findFirst({
        where: { id, clerkId },
      });
      if (!address) throw new NotFoundError("UserAddress", id);
      return address;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async createAddress(
    clerkId: string,
    data: Omit<Prisma.UserAddressCreateInput, "clerkId">,
  ) {
    try {
      if (data.isDefault) {
        await prisma.userAddress.updateMany({
          where: { clerkId },
          data: { isDefault: false },
        });
      }

      const addressCount = await prisma.userAddress.count({
        where: { clerkId },
      });
      const isDefault = data.isDefault ?? addressCount === 0; // make first address default automatically

      return await prisma.userAddress.create({
        data: {
          ...data,
          isDefault,
          clerkId,
        },
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async updateAddress(
    id: string,
    clerkId: string,
    data: Prisma.UserAddressUpdateInput,
  ) {
    try {
      if (data.isDefault === true) {
        await prisma.userAddress.updateMany({
          where: { clerkId, id: { not: id } },
          data: { isDefault: false },
        });
      }

      // Check if trying to unset the only default address
      if (data.isDefault === false) {
        const current = await prisma.userAddress.findFirst({
          where: { id, clerkId },
        });
        if (current?.isDefault) {
          const other = await prisma.userAddress.findFirst({
            where: { clerkId, id: { not: id } },
          });
          if (other) {
            await prisma.userAddress.update({
              where: { id: other.id },
              data: { isDefault: true },
            });
          } else {
            // if no other address, prevent removing default
            data.isDefault = true;
          }
        }
      }

      return await prisma.userAddress.update({
        where: { id },
        data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async deleteAddress(id: string, clerkId: string) {
    try {
      const address = await prisma.userAddress.findFirst({
        where: { id, clerkId },
      });
      if (!address) throw new NotFoundError("UserAddress", id);

      const deleted = await prisma.userAddress.delete({
        where: { id },
      });

      if (address.isDefault) {
        const remaining = await prisma.userAddress.findFirst({
          where: { clerkId },
        });
        if (remaining) {
          await prisma.userAddress.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }

      return deleted;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async setDefaultAddress(id: string, clerkId: string) {
    try {
      const address = await prisma.userAddress.findFirst({
        where: { id, clerkId },
      });
      if (!address) throw new NotFoundError("UserAddress", id);

      await prisma.$transaction([
        prisma.userAddress.updateMany({
          where: { clerkId },
          data: { isDefault: false },
        }),
        prisma.userAddress.update({
          where: { id },
          data: { isDefault: true },
        }),
      ]);

      return prisma.userAddress.findUnique({ where: { id } });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const userAddressService = new UserAddressService();
