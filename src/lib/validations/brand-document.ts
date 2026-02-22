import { z } from "zod";

const DocumentTypeEnum = z.enum([
  "RETURN_POLICY",
  "SHIPPING_POLICY",
  "REFUND_POLICY",
  "PRIVACY_POLICY",
  "TERMS_AND_CONDITIONS",
]);

export const createBrandDocumentSchema = z.object({
  type: DocumentTypeEnum,
  content: z.string().min(1, "Content is required"),
  version: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  brandId: z.string().uuid("Brand ID must be a valid UUID"),
});

export const updateBrandDocumentSchema = createBrandDocumentSchema.partial();
