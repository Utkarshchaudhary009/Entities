"use client";

import {
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { SizeDrawer } from "@/components/admin/size-drawer";
import { Button } from "@/components/ui/button";
import { useSizeStore } from "@/stores/size.store";
import type { ApiSize } from "@/types/api";

export default function AdminSizesPage() {
  const {
    items: sizes,
    meta,
    isLoading,
    fetchAll: fetch,
    delete: remove,
  } = useSizeStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  useEffect(() => {
    fetch({ page: 1, limit: 50 });
  }, [fetch]);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingId(undefined);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success("Size deleted");
    } catch (error) {
      console.error("Failed to delete size", { id, error });
      toast.error("Failed to delete size");
    }
  };

  const columns: DataTableColumn<ApiSize>[] = [
    {
      key: "label",
      label: "Label",
      render: (value) => (
        <span className="font-semibold text-foreground">{String(value)}</span>
      ),
    },
    {
      key: "sortOrder",
      label: "Sort Order",
      render: (value) => (
        <span className="text-sm text-muted-foreground">{Number(value)}</span>
      ),
    },
    {
      key: "measurements",
      label: "Measurements",
      render: (value) => {
        if (!value || Object.keys(value as object).length === 0)
          return <span className="text-xs text-muted-foreground">—</span>;
        const preview = Object.entries(value as Record<string, string>)
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        return (
          <span className="max-w-[200px] truncate text-xs text-muted-foreground">
            {preview}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.id)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
            <span className="sr-only">Edit size</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.id)}
            className="size-8 text-muted-foreground hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            <span className="sr-only">Delete size</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sizes</h1>
          <p className="text-sm text-muted-foreground">
            Manage product sizes and their measurements.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 shadow-sm transition-transform active:scale-95"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Add Size
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={sizes}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(page) => fetch({ page, limit: 50 })}
        searchPlaceholder="Search sizes..."
      />

      <SizeDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editingId={editingId}
      />
    </div>
  );
}
