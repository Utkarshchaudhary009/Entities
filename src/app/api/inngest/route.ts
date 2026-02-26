import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { entityCrudFunctions } from "@/inngest/functions/entity-crud";
import { uploadFunctions } from "@/inngest/functions/upload.functions";
import { userProfileFunctions } from "@/inngest/functions/user-profile";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ...entityCrudFunctions,
    ...uploadFunctions,
    ...userProfileFunctions,
  ],
});
