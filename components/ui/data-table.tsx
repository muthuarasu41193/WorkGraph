"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

const VIRTUALIZE_AFTER = 50;

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Fixed row height used when virtualizing. */
  rowHeight?: number;
  className?: string;
  "aria-label"?: string;
  empty?: ReactNode;
};

/**
 * Shared headless DataTable foundation (TanStack Table + optional virtualization).
 * Screens pass columns/data only; keep previous rows visible while parents load.
 */
export function DataTable<TData>({
  columns,
  data,
  sorting: sortingProp,
  onSortingChange,
  rowHeight = 44,
  className,
  "aria-label": ariaLabel = "Data table",
  empty,
}: DataTableProps<TData>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const controlled = sortingProp !== undefined;
  const sorting = controlled ? sortingProp : internalSorting;

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (controlled) onSortingChange?.(next);
      else setInternalSorting(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const virtualize = rows.length > VIRTUALIZE_AFTER;
  const virtualizer = useVirtualizer({
    count: virtualize ? rows.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  if (rows.length === 0) {
    return (
      <div className={cn("rounded-card border border-hairline bg-surface-raised p-6", className)} role="status">
        {empty ?? <p className="text-role-body-small text-ink-subtle">No rows</p>}
      </div>
    );
  }

  const headerGroups = table.getHeaderGroups();

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto rounded-card border border-hairline bg-surface-raised", className)}
      role="region"
      aria-label={ariaLabel}
    >
      <table className="w-full border-collapse text-role-body-small" aria-rowcount={rows.length}>
        <thead className="sticky top-0 z-sticky bg-surface-raised">
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-hairline">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : canSort ? "none" : undefined
                    }
                    className="px-3 py-2 text-left font-medium text-ink"
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center gap-1 text-left"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="text-ink-subtle" aria-hidden>
                          {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : ""}
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        {virtualize ? (
          <tbody
            className="relative"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className="absolute left-0 flex w-full border-b border-hairline"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="flex flex-1 items-center px-3 py-2 text-ink">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        ) : (
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-hairline last:border-b-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 text-ink">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

export type { ColumnDef, SortingState };
