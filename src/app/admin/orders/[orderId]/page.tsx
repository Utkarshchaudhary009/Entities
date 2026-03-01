"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft01Icon,
  Location01Icon,
  PackageIcon,
  Settings02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateOrderDetailsSchema } from "@/lib/validations/order";
import { useOrderStore } from "@/stores/order.store";
import type { ApiOrder } from "@/types/api";
import { ORDER_STATUSES, type OrderStatus } from "@/types/domain";

function CustomerInfoCard({ order }: { order: ApiOrder }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <HugeiconsIcon
          icon={UserIcon}
          className="h-5 w-5 text-muted-foreground"
        />
        <CardTitle className="text-lg">Customer Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Name</p>
          <p className="text-base">{order.customerName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
          <a
            href={`https://wa.me/${order.whatsappNumber.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="text-base text-primary hover:underline"
          >
            {order.whatsappNumber}
          </a>
        </div>
        {order.email && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <a
              href={`mailto:${order.email}`}
              className="text-base text-primary hover:underline"
            >
              {order.email}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShippingAddressCard({ order }: { order: ApiOrder }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <HugeiconsIcon
          icon={Location01Icon}
          className="h-5 w-5 text-muted-foreground"
        />
        <CardTitle className="text-lg">Shipping Address</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-base">{order.address}</p>
        <p className="text-base">
          {order.city}, {order.state} {order.pincode}
        </p>
      </CardContent>
    </Card>
  );
}

function OrderItemsCard({ order }: { order: ApiOrder }) {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={PackageIcon}
            className="h-5 w-5 text-muted-foreground"
          />
          <CardTitle className="text-lg">Order Items</CardTitle>
        </div>
        <div className="text-sm text-muted-foreground">
          {order.items.length} item{order.items.length !== 1 && "s"}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 py-2"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{item.productName}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.size} • {item.color}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>
                Discount {order.discountCode ? `(${order.discountCode})` : ""}
              </span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          {order.shippingCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatCurrency(order.shippingCost)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminManagementCard({ order }: { order: ApiOrder }) {
  const { updateOrderDetails } = useOrderStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateOrderDetailsSchema),
    defaultValues: {
      status: order.status,
      adminNotes: order.adminNotes || "",
    },
  });

  const status = watch("status");
  const adminNotes = watch("adminNotes");

  const onSubmit = async (data: z.infer<typeof updateOrderDetailsSchema>) => {
    try {
      setIsUpdating(true);
      await updateOrderDetails(order.id, {
        status: data.status as OrderStatus,
        adminNotes: data.adminNotes?.trim(),
      });

      const error = useOrderStore.getState().error;
      if (error) {
        toast.error(error || "Failed to update order");
      } else {
        toast.success("Order updated successfully");
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center gap-2 border-b bg-muted/20 pb-4">
        <HugeiconsIcon
          icon={Settings02Icon}
          className="h-5 w-5 text-muted-foreground"
        />
        <CardTitle className="text-lg">Admin Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="order-status-select"
                className="text-sm font-medium"
              >
                Order Status
              </label>
              <Select
                value={status}
                onValueChange={(val: OrderStatus) =>
                  setValue("status", val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="order-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current status: <StatusBadge status={order.status} />
              </p>
              {errors.status && (
                <p className="text-xs text-destructive">
                  {String(errors.status.message)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-notes-textarea"
                className="text-sm font-medium"
              >
                Admin Notes (Internal)
              </label>
              <Textarea
                id="admin-notes-textarea"
                placeholder="Add notes about this order..."
                {...register("adminNotes")}
                className="min-h-[100px] resize-y"
              />
              {errors.adminNotes && (
                <p className="text-xs text-destructive">
                  {String(errors.adminNotes.message)}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={
                isUpdating ||
                (status === order.status &&
                  (adminNotes || "").trim() === (order.adminNotes || "").trim())
              }
              className="w-full md:w-auto transition-transform active:scale-95"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { selectedItem: order, fetchOne, isLoading } = useOrderStore();

  useEffect(() => {
    fetchOne(orderId);
  }, [orderId, fetchOne]);

  if (isLoading || !order) {
    return (
      <div className="flex-1 space-y-6 flex flex-col pt-2 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 flex flex-col pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="h-9 w-9">
          <Link href="/admin/orders">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {order.orderNumber}
            <StatusBadge status={order.status} />
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomerInfoCard order={order} />
        <ShippingAddressCard order={order} />
        <OrderItemsCard order={order} />
        <AdminManagementCard order={order} />
      </div>
    </div>
  );
}
