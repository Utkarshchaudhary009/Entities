import { safeInngestSend } from "@/inngest/safe-send";
import { badRequest, handleError, successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";
import {
  isValidFileSize,
  isValidFileType,
  uploadMetaSchema,
} from "@/lib/validations/upload";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const filename = formData.get("filename");
    const bucket = formData.get("bucket");

    if (!file || !(file instanceof File)) {
      return badRequest("Missing or invalid file");
    }

    // Validate metadata
    const metaParsed = uploadMetaSchema.safeParse({
      filename: typeof filename === "string" ? filename : "",
      bucket: typeof bucket === "string" ? bucket : "",
    });

    if (!metaParsed.success) {
      return badRequest("Invalid metadata (filename or bucket missing)");
    }

    if (!isValidFileSize(file.size)) {
      return badRequest("File exceeds 10MB limit");
    }

    if (!isValidFileType(file.type)) {
      return badRequest("Unsupported file type");
    }

    // Convert file to base64 for Inngest payload
    const arrayBuffer = await file.arrayBuffer();
    const base64Buffer = Buffer.from(arrayBuffer).toString("base64");

    const idempotencyKey = `storage/upload:${guard.auth.userId}:${metaParsed.data.filename}:${file.size}`;

    // Send async job to upload the actual file
    await safeInngestSend({
      name: "storage/file.upload.v1",
      data: {
        bucket: metaParsed.data.bucket,
        filename: metaParsed.data.filename,
        fileBuffer: base64Buffer,
        contentType: file.type,
        actorId: guard.auth.userId,
        idempotencyKey,
      },
    });

    // Return 202 Accepted immediately so UI doesn't block
    return successResponse({ success: true }, 202);
  } catch (error) {
    return handleError(error, "Upload API");
  }
}
