import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  whatsappNumber: z.string().min(10, "Invalid WhatsApp number"),
  email: z.string().email("Invalid email").optional(),
  address: z.string().min(5, "Address is too short"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(5, "Invalid pincode"),
  sessionId: z.string().uuid("Session ID must be a valid UUID"),
});
