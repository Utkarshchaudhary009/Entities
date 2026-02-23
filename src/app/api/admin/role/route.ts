import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { handleError, successResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";

const updateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "user"], {
    message: "Role must be 'admin' or 'user'",
  }),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.success) return guard.response;

  try {
    const json = await request.json();
    const { userId, role } = updateRoleSchema.parse(json);

    const client = await clerkClient();

    await client.users.updateUser(userId, {
      publicMetadata: { role },
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleError(error, "Update role");
  }
}
