import { inngest } from "../client";

export const userAddressCreated = inngest.createFunction(
  { id: "user-address-created" },
  { event: "user/address.created.v1" },
  async ({ event, step }) => {
    const { id, clerkId, label, city } = event.data;

    await step.run("log-audit", async () => {
      console.log(
        `[Audit] Address ${id} (${label}) created for user ${clerkId} in ${city}`,
      );
    });

    await step.run("send-welcome-email-if-first", async () => {
      // Simulate sending a welcome email if this is the first address
      console.log(
        `[Email] Welcoming user ${clerkId} to their new address in ${city}`,
      );
    });

    return { success: true };
  },
);

export const userAddressUpdated = inngest.createFunction(
  { id: "user-address-updated" },
  { event: "user/address.updated.v1" },
  async ({ event, step }) => {
    const { id, clerkId, changes } = event.data;

    await step.run("log-audit", async () => {
      console.log(`[Audit] Address ${id} updated for user ${clerkId}`, changes);
    });

    return { success: true };
  },
);

export const userAddressDeleted = inngest.createFunction(
  { id: "user-address-deleted" },
  { event: "user/address.deleted.v1" },
  async ({ event, step }) => {
    const { id, clerkId } = event.data;

    await step.run("log-audit", async () => {
      console.log(`[Audit] Address ${id} deleted for user ${clerkId}`);
    });

    return { success: true };
  },
);

export const userPreferencesUpdated = inngest.createFunction(
  { id: "user-preferences-updated" },
  { event: "user/preferences.updated.v1" },
  async ({ event, step }) => {
    const { clerkId, changes } = event.data;

    await step.run("sync-external-services", async () => {
      console.log(`[Sync] Updating preferences for user ${clerkId}`, changes);
      // Example: If notifyEmail is false, unsubscribe from mailing list
      if (changes.notifyEmail === false) {
        console.log(
          `[Email] Unsubscribing user ${clerkId} from marketing emails`,
        );
      }
    });

    return { success: true };
  },
);

export const userProfileFunctions = [
  userAddressCreated,
  userAddressUpdated,
  userAddressDeleted,
  userPreferencesUpdated,
];
