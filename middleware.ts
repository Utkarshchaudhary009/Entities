import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function middleware(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata?.role;

  if (role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
