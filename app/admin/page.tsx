import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Order {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    shipping_address: {
        name: string;
        phone: string;
        addressLine1: string;
        city: string;
        state: string;
        postalCode: string;
    };
    created_at: string;
    order_items: {
        product: {
            name: string;
        };
        quantity: number;
        price: number;
    }[];
}

export default async function AdminOrdersPage() {
    const supabase = createServerSupabaseClient();

    const { data: orders, error } = await supabase
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

    if (error) {
        console.error("Error fetching orders:", error);
    }

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Pending Orders
            </h1>
            <p className="mt-1 text-muted-foreground">
                View and manage customer orders.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orders?.map((order: Order) => (
                    <Card key={order.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                    Order #{order.id.slice(0, 8)}
                                </CardTitle>
                                <Badge variant="secondary">{order.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Products */}
                            <div>
                                <h4 className="text-sm font-medium">Items</h4>
                                <ul className="mt-1 text-sm text-muted-foreground">
                                    {order.order_items?.map((item, i) => (
                                        <li key={i}>
                                            {item.quantity}x {item.product?.name || "Unknown"} - ₹
                                            {item.price}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Shipping */}
                            <div>
                                <h4 className="text-sm font-medium">Shipping To</h4>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    <p className="font-medium text-foreground">
                                        {order.shipping_address?.name}
                                    </p>
                                    <p>{order.shipping_address?.phone}</p>
                                    <p>
                                        {order.shipping_address?.addressLine1},{" "}
                                        {order.shipping_address?.city},{" "}
                                        {order.shipping_address?.state} -{" "}
                                        {order.shipping_address?.postalCode}
                                    </p>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between border-t pt-3">
                                <span className="font-medium">Total</span>
                                <span className="text-lg font-bold">
                                    ₹{order.total_amount.toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!orders?.length && (
                    <p className="col-span-full text-center text-muted-foreground">
                        No pending orders.
                    </p>
                )}
            </div>
        </div>
    );
}
