import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

// Helper to validate file size and type (used on both client and server if needed)
export function isValidFileType(type: string): boolean {
  return ALLOWED_MIME_TYPES.includes(type);
}

export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

// Validation schema for the upload endpoint payload
// Note: We don't validate the File object itself here via zod because we use FormData in the API,
// but we validate the metadata.
export const uploadMetaSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  bucket: z.string().min(1, "Bucket is required"),
});
