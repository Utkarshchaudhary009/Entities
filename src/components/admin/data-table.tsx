"use client";

import {
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  InboxDownloadIcon,
  Search02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
}

export interface DataTableMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row data — already fetched by the parent via the store */
  data: T[];
  /** Show skeleton rows while the store is loading */
  isLoading?: boolean;
  /** Pagination meta from the store */
  meta?: DataTableMeta;
  /** Called when the user changes page — store handles the fetch */
  onPageChange?: (page: number) => void;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Called on search input change — store handles the fetch */
  onSearch?: (query: string) => void;
  /** Current search value (controlled) */
  searchValue?: string;
}

const SKELETON_ROWS = 5;

/**
 * DataTable — generic, paginated admin table.
 *
 * Fully store-driven: receives already-resolved data + meta from the
 * parent page which reads them from a Zustand store. No fetch inside.
 */
export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading = false,
  meta,
  onPageChange,
  searchPlaceholder = "Search…",
  onSearch,
  searchValue = "",
}: DataTableProps<T>) {
  const canPrevPage = (meta?.page ?? 1) > 1;
  const canNextPage = (meta?.page ?? 1) < (meta?.totalPages ?? 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Search02Icon bar */}
      {onSearch !== undefined && (
        <div className="relative max-w-sm">
          <HugeiconsIcon
            icon={Search02Icon}
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="data-table-search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                <TableRow key={`skeleton-${rowIdx}`}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      <Skeleton className="h-4 w-full max-w-[160px] animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                    <HugeiconsIcon
                      icon={InboxDownloadIcon}
                      className="size-8 opacity-40"
                    />
                    <span className="text-sm">No results found.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              data.map((row) => (
                <TableRow
                  key={row.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className="text-sm">
                      {col.render
                        ? col.render(
                            (row as Record<string, unknown>)[col.key as string],
                            row,
                          )
                        : String(
                            (row as Record<string, unknown>)[
                              col.key as string
                            ] ?? "",
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} &mdash; {meta.total} total
          </span>
          <div className="flex items-center gap-2">
            <Button
              id="data-table-prev"
              variant="outline"
              size="sm"
              disabled={!canPrevPage || isLoading}
              onClick={() => onPageChange?.(meta.page - 1)}
              className="gap-1"
            >
              <HugeiconsIcon icon={ArrowLeftDoubleIcon} className="size-4" />
              Prev
            </Button>
            <Button
              id="data-table-next"
              variant="outline"
              size="sm"
              disabled={!canNextPage || isLoading}
              onClick={() => onPageChange?.(meta.page + 1)}
              className="gap-1"
            >
              Next
              <HugeiconsIcon icon={ArrowRightDoubleIcon} className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
