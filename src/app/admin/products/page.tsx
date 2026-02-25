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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/data-table";
import { ProductDrawer } from "@/components/admin/product-drawer";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(
    null,
  );
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts({ page: 1, limit: 20 });
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handlePageChange = (page: number) => {
    fetchProducts({ page, limit: meta.limit, search });
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    fetchProducts({ page: 1, limit: meta.limit, search: query });
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const handleEdit = (product: ApiProduct) => {
    setSelectedProduct(product);
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      toast.success("Product deleted");
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

  const filteredProducts = useMemo(() => {
    if (!categoryFilter) return products;
    return products.filter((p) => p.categoryId === categoryFilter);
  }, [products, categoryFilter]);

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
              className="object-cover"
              sizes="40px"
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
      render: (value: unknown) => {
        const price = Number(value) / 100;
        return (
          <span className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(price)}
          </span>
        );
      },
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
                onCheckedChange={() => setCategoryFilter(null)}
              >
                All Categories
              </DropdownMenuCheckboxItem>
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={categoryFilter === category.id}
                  onCheckedChange={() => setCategoryFilter(category.id)}
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
        data={filteredProducts}
        isLoading={isLoading}
        meta={meta}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchValue={search}
        searchPlaceholder="Search products..."
      />

      <ProductDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        product={selectedProduct}
      />
    </div>
  );
}
