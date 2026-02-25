"use client";

import { PencilEdit01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { DiscountDrawer } from "@/components/admin/discount-drawer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDiscountStore } from "@/stores/discount.store";
import type { ApiDiscount } from "@/types/api";
import { DISCOUNT_TYPE_LABELS } from "@/types/domain";

const TYPE_CLASS: Record<ApiDiscount["discountType"], string> = {
  PERCENTAGE:
    "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30",
  FIXED:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
  BOGO: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-500/30",
};

export default function AdminDiscountsPage() {
  const {
    items: discounts,
    meta,
    isLoading,
    fetchAll: fetch,
    update,
  } = useDiscountStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch({ page: 1, limit: 20 });
  }, [fetch]);

  const handlePageChange = (page: number) => {
    fetch({ page, limit: 20 });
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingId(undefined);
    setDrawerOpen(true);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    if (togglingIds.has(id)) return;
    setTogglingIds((prev) => new Set(prev).add(id));
    try {
      await update(id, { isActive: !current });
    } catch (error) {
      console.error("Failed to toggle discount status", error);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const columns: DataTableColumn<ApiDiscount>[] = [
    {
      key: "code",
      label: "Code",
      render: (value) => (
        <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
          {String(value)}
        </span>
      ),
    },
    {
      key: "discountType",
      label: "Type",
      render: (value) => {
        const t = String(value) as ApiDiscount["discountType"];
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASS[t] ?? "bg-muted text-muted-foreground"}`}
          >
            {DISCOUNT_TYPE_LABELS[t] ?? t}
          </span>
        );
      },
    },
    {
      key: "value",
      label: "Value",
      render: (value, row) => {
        const v = Number(value);
        return (
          <span className="font-medium text-foreground">
            {row.discountType === "PERCENTAGE" ? `${v}%` : `₹${v}`}
          </span>
        );
      },
    },
    {
      key: "usageCount",
      label: "Usage",
      render: (value, row) => (
        <span className="text-sm text-muted-foreground">
          {Number(value)}
          {row.usageLimit ? ` / ${row.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "expiresAt",
      label: "Expires",
      render: (value) => {
        if (!value)
          return <span className="text-xs text-muted-foreground">Never</span>;
        try {
          return (
            <span className="text-sm text-muted-foreground">
              {format(new Date(String(value)), "dd MMM yyyy")}
            </span>
          );
        } catch {
          return <span className="text-xs text-muted-foreground">—</span>;
        }
      },
    },
    {
      key: "isActive",
      label: "Active",
      render: (value, row) => (
        <Switch
          checked={Boolean(value)}
          disabled={togglingIds.has(row.id)}
          onCheckedChange={() => handleToggleActive(row.id, Boolean(value))}
          aria-label="Toggle discount active status"
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.id)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
            <span className="sr-only">Edit discount</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage coupon codes, types, and expiry dates.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 shadow-sm transition-transform active:scale-95"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Add Discount
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={discounts}
        isLoading={isLoading}
        meta={meta}
        onPageChange={handlePageChange}
        searchPlaceholder="Search discounts..."
      />

      <DiscountDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editingId={editingId}
      />
    </div>
  );
}
