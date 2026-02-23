import { inngest } from "@/inngest/client";

const heartbeat = inngest.createFunction(
  { id: "app-heartbeat" },
  { cron: "*/15 * * * *" },
  async () => {
    // Keep this function intentionally minimal: its purpose is to ensure the Inngest
    // integration is active even before entity events are emitted.
    return { ok: true };
  },
);

export const entityCrudFunctions = [heartbeat];
