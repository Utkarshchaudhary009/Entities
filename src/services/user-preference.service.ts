import type { Prisma } from "@/generated/prisma/client";
import { handlePrismaError } from "@/lib/errors";
import prisma from "@/lib/prisma";

export class UserPreferenceService {
  async getPreferences(clerkId: string) {
    try {
      let pref = await prisma.userPreference.findUnique({
        where: { clerkId },
      });

      if (!pref) {
        pref = await prisma.userPreference.create({
          data: { clerkId },
        });
      }

      return pref;
    } catch (error) {
      return handlePrismaError(error);
    }
  }

  async updatePreferences(
    clerkId: string,
    data: Omit<Prisma.UserPreferenceUpdateInput, "clerkId">,
  ) {
    try {
      return await prisma.userPreference.upsert({
        where: { clerkId },
        create: {
          clerkId,
          // Extract primitive boolean values for create
          notifyPush:
            typeof data.notifyPush === "boolean" ? data.notifyPush : undefined,
          notifyEmail:
            typeof data.notifyEmail === "boolean"
              ? data.notifyEmail
              : undefined,
          notifySms:
            typeof data.notifySms === "boolean" ? data.notifySms : undefined,
          notifyInApp:
            typeof data.notifyInApp === "boolean"
              ? data.notifyInApp
              : undefined,
        },
        update: data,
      });
    } catch (error) {
      return handlePrismaError(error);
    }
  }
}

export const userPreferenceService = new UserPreferenceService();
