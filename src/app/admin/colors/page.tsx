"use client";

import {
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ColorDrawer } from "@/components/admin/color-drawer";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { useColorStore } from "@/stores/color.store";
import type { ApiColor } from "@/types/api";

export default function AdminColorsPage() {
  const {
    items: colors,
    meta,
    isLoading,
    fetchAll: fetch,
    delete: remove,
  } = useColorStore();

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
      toast.success("Color deleted");
    } catch (error) {
      console.error("Color delete failed", error);
      toast.error("Failed to delete color");
    }
  };

  const columns: DataTableColumn<ApiColor>[] = [
    {
      key: "hex",
      label: "Swatch",
      render: (value) => (
        <div className="flex items-center gap-2.5">
          <div
            className="size-7 shrink-0 rounded-full border border-border shadow-sm transition-transform hover:scale-110"
            style={{ backgroundColor: String(value) }}
            title={String(value)}
          />
          <span className="font-mono text-xs text-muted-foreground">
            {String(value).toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (value) => (
        <span className="font-medium text-foreground">{String(value)}</span>
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
      key: "actions",
      label: "",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.id)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
            <span className="sr-only">Edit color</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.id)}
            className="size-8 text-muted-foreground hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            <span className="sr-only">Delete color</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colors</h1>
          <p className="text-sm text-muted-foreground">
            Manage product color swatches and sort ordering.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 shadow-sm transition-transform active:scale-95"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Add Color
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={colors}
        isLoading={isLoading}
        meta={meta}
        onPageChange={(page) => fetch({ page, limit: 50 })}
        searchPlaceholder="Search colors..."
      />

      <ColorDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editingId={editingId}
      />
    </div>
  );
}
