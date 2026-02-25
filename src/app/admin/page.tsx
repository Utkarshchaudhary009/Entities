import { redirect } from "next/navigation";

/**
 * /admin → redirect to the dashboard.
 * Uses server-side redirect to avoid a flash of blank content.
 */
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
