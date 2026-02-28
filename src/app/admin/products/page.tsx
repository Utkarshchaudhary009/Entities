"use client";

import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
  FilterHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/data-table";
import { ProductDrawer } from "@/components/admin/product-drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { useCategoryStore } from "@/stores/category.store";
import { useProductStore } from "@/stores/product.store";
import type { ApiProduct } from "@/types/api";

export default function AdminProductsPage() {
  const {
    products,
    meta,
    isLoading,
    fetchProducts,
    updateProduct,
    deleteProduct,
  } = useProductStore();
  const { items: categories, fetchAll: fetchCategories } = useCategoryStore();

  const [search, setSearch] = useState("");
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    product: ApiProduct | null;
  }>({
    isOpen: false,
    mode: "create",
    product: null,
  });
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount
  useEffect(() => {
    fetchProducts({ page: 1, limit: 20 });
    fetchCategories();
  }, []);

  const handlePageChange = (page: number) => {
    fetchProducts({
      page,
      limit: meta.limit,
      search,
      categoryId: categoryFilter || undefined,
    });
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    fetchProducts({
      page: 1,
      limit: meta.limit,
      search: query,
      categoryId: categoryFilter || undefined,
    });
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setCategoryFilter(categoryId);
    fetchProducts({
      page: 1,
      limit: meta.limit,
      search,
      categoryId: categoryId || undefined,
    });
  };

  const handleCreate = () => {
    setDrawerState({ isOpen: true, mode: "create", product: null });
  };

  const handleEdit = (product: ApiProduct) => {
    setDrawerState({ isOpen: true, mode: "edit", product });
  };

  const handleDelete = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete);
      toast.success("Product deleted");
      setProductToDelete(null);
    }
  };

  const handleToggleActive = async (product: ApiProduct, checked: boolean) => {
    try {
      await updateProduct(product.id, { isActive: checked });
      toast.success(
        `Product ${checked ? "activated" : "deactivated"} successfully`,
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const columns = [
    {
      key: "thumbnailUrl",
      label: "Thumbnail",
      render: (_: unknown, row: ApiProduct) => (
        <div className="relative size-10 overflow-hidden rounded-md border bg-muted">
          {row.thumbnailUrl ? (
            <Image
              src={row.thumbnailUrl}
              alt={row.name}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No Img
            </div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (_: unknown, row: ApiProduct) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/products/${row.id}`}
            className="font-medium hover:underline"
          >
            {row.name}
          </Link>
          <span className="text-xs text-muted-foreground">{row.slug}</span>
        </div>
      ),
    },
    {
      key: "categoryId",
      label: "Category",
      render: (_: unknown, row: ApiProduct) => {
        const category = categories.find((c) => c.id === row.categoryId);
        return category ? (
          <Badge variant="outline">{category.name}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: "price",
      label: "Price",
      render: (value: unknown) => (
        <span className="font-medium">
          {formatCurrency(Number(value) / 100)}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Active",
      render: (_: unknown, row: ApiProduct) => (
        <Switch
          checked={row.isActive}
          onCheckedChange={(checked) => handleToggleActive(row, checked)}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: ApiProduct) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row)}
            className="size-8"
          >
            <HugeiconsIcon icon={Edit02Icon} className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.id)}
            className="size-8 text-destructive hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <HugeiconsIcon
                  icon={FilterHorizontalIcon}
                  className="size-3.5"
                />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={categoryFilter === null}
                onCheckedChange={() => handleCategoryFilter(null)}
              >
                All Categories
              </DropdownMenuCheckboxItem>
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={categoryFilter === category.id}
                  onCheckedChange={() => handleCategoryFilter(category.id)}
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleCreate} size="sm" className="gap-1">
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Add Product
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        meta={meta}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchValue={search}
        searchPlaceholder="Search products..."
      />

      <ProductDrawer
        open={drawerState.isOpen}
        onOpenChange={(open) =>
          setDrawerState((prev) => ({ ...prev, isOpen: open }))
        }
        mode={drawerState.mode}
        product={drawerState.product}
      />

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product and all associated variants from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
