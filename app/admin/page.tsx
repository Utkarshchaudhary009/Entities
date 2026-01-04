import { createServerSupabaseClient } from "@/lib/supabase/server";
import OrderCard from "@/components/admin/OrderCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle2, Clock } from "lucide-react";

export default async function AdminOrdersPage() {
    const supabase = createServerSupabaseClient();

    // Fetch pending orders
    const { data: pendingOrders, error: pendingError } = await supabase
        .from("orders")
        .select(`
      *,
      order_items (
        quantity,
        price,
        product:products (name)
      )
    `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    // Fetch completed count (simple approximate for stats)
    const { count: completedCount, error: countError } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("status", "completed");

    // Fetch pending count
    const { count: pendingCount, error: pendingCountError } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending");

    if (pendingError || countError) {
        console.error("Error fetching orders:", pendingError || countError);
    }

    const stats = [
        {
            title: "Pending Orders",
            value: pendingCount || 0,
            icon: Clock,
            className: "text-orange-600",
        },
        {
            title: "Completed Orders",
            value: completedCount || 0,
            icon: CheckCircle2,
            className: "text-green-600",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Dashboard
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Overview of store activity.
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.className}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Orders List */}
            <div>
                <h2 className="mb-4 text-lg font-semibold">Pending Orders</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingOrders?.map((order) => (
                        // @ts-ignore
                        <OrderCard key={order.id} order={order} />
                    ))}
                    {!pendingOrders?.length && (
                        <p className="col-span-full py-8 text-center text-muted-foreground">
                            No pending orders.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
