import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Check if the current user is authorized
  const { sessionClaims } = await auth();

  // 1. Authorization: Only admins can change roles
  if (sessionClaims?.metadata.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId, role } = await request.json();

    // 2. Validate input
    if (!userId || !["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const client = await clerkClient();

    // 3. Update the user's metadata in Clerk
    await client.users.updateUser(userId, {
      publicMetadata: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
