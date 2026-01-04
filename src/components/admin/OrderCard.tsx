"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

interface Order {
  id: string;
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

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useSupabase();

  const markAsCompleted = async () => {
    if (!confirm("Are you sure you want to mark this order as completed?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", order.id);

      if (error) throw error;

      toast.success("Order marked as completed");
      router.refresh(); // Refresh server component
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base truncate">
            {order.shipping_address?.name || "Unknown User"}
          </CardTitle>
          <Badge variant={order.status === "completed" ? "default" : "secondary"}>
            {order.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Ordered on {new Date(order.created_at).toLocaleDateString("en-IN", {
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
                {item.quantity}x {item.product?.name || "Unknown"} - ₹{item.price}
              </li>
            ))}
          </ul>
        </div>

        {/* Shipping */}
        <div className="rounded-md bg-muted/50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shipping Address</h4>
          <div className="mt-1 text-sm">
            <p className="font-medium text-foreground">{order.shipping_address?.name}</p>
            <p className="text-muted-foreground">{order.shipping_address?.phone}</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">
              {order.shipping_address?.addressLine1}, {order.shipping_address?.city}
              {"\n"}
              {order.shipping_address?.state} - {order.shipping_address?.postalCode}
            </p>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t pt-3">
          <span className="font-medium">Total Amount</span>
          <span className="text-lg font-bold text-primary">
            ₹{order.total_amount.toLocaleString()}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        {order.status === "pending" && (
            <Button 
                onClick={markAsCompleted} 
                className="w-full gap-2" 
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Mark as Completed
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
