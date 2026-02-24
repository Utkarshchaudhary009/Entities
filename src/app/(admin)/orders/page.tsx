"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DataTableColumn } from "@/components/admin/data-table";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useOrderStore } from "@/stores/order.store";
import type { ApiOrder } from "@/types/api";
import { ORDER_STATUSES } from "@/types/domain";

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { items, meta, fetchAll, isLoading } = useOrderStore();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "ALL",
  );
  const [currentPage, setCurrentPage] = useState(() => {
    const page = Number(searchParams.get("page"));
    return Number.isFinite(page) && page > 0 ? page : 1;
  });

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }

    if (statusFilter && statusFilter !== "ALL") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }

    params.set("page", currentPage.toString());

    router.replace(`${pathname}?${params.toString()}`);

    fetchAll({
      page: currentPage,
      limit: 20,
      search: debouncedSearch || undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    });
  }, [currentPage, debouncedSearch, statusFilter, router, pathname, fetchAll]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const columns: DataTableColumn<ApiOrder>[] = [
    {
      key: "orderNumber",
      label: "Order",
      render: (_, row) => (
        <Link
          href={`/admin/orders/${row.id}`}
          className="font-medium hover:underline text-primary"
          onMouseEnter={() => useOrderStore.getState().fetchOne(row.id)}
        >
          {row.orderNumber}
        </Link>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (_, row) => (
        <span className="text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
    },
    {
      key: "total",
      label: "Total",
      render: (_, row) => <span>{formatCurrency(row.total)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <Link
          href={`/admin/orders/${row.id}`}
          className="flex justify-end pr-4 text-muted-foreground hover:text-foreground transition-colors"
          onMouseEnter={() => useOrderStore.getState().fetchOne(row.id)}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="flex-1 space-y-6 flex flex-col pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and view all customer orders
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <Input
          placeholder="Search order #, customer, or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchTerm || statusFilter !== "ALL") && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex-1">
        <DataTable
          columns={columns}
          data={items}
          meta={meta}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
