import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { entityCrudFunctions } from "@/inngest/functions/entity-crud";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [...entityCrudFunctions],
});
