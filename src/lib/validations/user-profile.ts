import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(5, "Valid pincode is required"),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressSchema.partial();

export const preferencesSchema = z.object({
  notifyPush: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyInApp: z.boolean().optional(),
});
