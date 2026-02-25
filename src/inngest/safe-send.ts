import { inngest } from "@/inngest/client";

export type InngestSendPayload = Parameters<typeof inngest.send>[0];

export async function safeInngestSend(payload: InngestSendPayload) {
  try {
    await inngest.send(payload);
  } catch (error) {
    console.error("Inngest send failed", error);
  }
}
