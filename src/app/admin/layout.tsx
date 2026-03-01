import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "./layout-client";

/**
 * Admin shell layout — server component.
 * Guards: only users with `user_role === "admin"` may pass.
 * Renders AdminLayoutClient which activates the sidebar and
 * places <AdminSidebar> next to page content.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sessionClaims } = await auth();

  const userRole = sessionClaims?.metadata?.role;
  if (userRole !== "admin") {
    redirect("/");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
