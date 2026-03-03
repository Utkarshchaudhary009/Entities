"use client";

import { PencilEdit01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { CategoryDrawer } from "@/components/admin/category-drawer";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { BlurImage } from "@/components/ui/blur-image";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCategoryStore } from "@/stores/category.store";
import type { ApiCategory } from "@/types/api";

export default function AdminCategoriesPage() {
  const {
    items: categories,
    meta,
    isLoading,
    fetchAll: fetch,
    update,
  } = useCategoryStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetch({ page: 1, limit: 10 });
  }, [fetch]);

  const handlePageChange = (page: number) => {
    fetch({ page, limit: 10, search: searchValue });
  };

  const handleSearch = (query: string) => {
    setSearchValue(query);
    // You might want to debounce this in a real scenario
    fetch({ page: 1, limit: 10, search: query });
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingId(undefined);
    setDrawerOpen(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await update(id, { isActive: !currentStatus });
    } catch (error) {
      console.error("Failed to toggle category status", error);
    }
  };

  const columns: DataTableColumn<ApiCategory>[] = [
    {
      key: "thumbnailUrl",
      label: "Image",
      render: (value) => {
        const url = value as string | null | undefined;
        return (
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/50">
            {url ? (
              <BlurImage
                src={url}
                alt="Category thumbnail"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground">No img</span>
            )}
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Name",
      render: (value) => (
        <span className="font-medium text-foreground">{String(value)}</span>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (value) => (
        <span className="text-muted-foreground">{String(value)}</span>
      ),
    },
    {
      key: "discountPercent",
      label: "Discount",
      render: (value) => (
        <span className="inline-flex items-center justify-center rounded-full bg-accent/50 px-2 py-0.5 text-xs font-medium text-accent-foreground">
          {Number(value)}%
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Active",
      render: (value, row) => (
        <Switch
          checked={Boolean(value)}
          onCheckedChange={() => handleToggleActive(row.id, Boolean(value))}
          aria-label="Toggle category active status"
        />
      ),
    },
    {
      key: "sortOrder",
      label: "Sort",
      render: (value) => (
        <span className="text-muted-foreground">{Number(value)}</span>
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
            <span className="sr-only">Edit category</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories, discounts, and sort ordering.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 shadow-sm transition-transform active:scale-95"
        >
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        meta={meta}
        onPageChange={handlePageChange}
        searchPlaceholder="Search categories..."
        onSearch={handleSearch}
        searchValue={searchValue}
      />

      <CategoryDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editingId={editingId}
      />
    </div>
  );
}
