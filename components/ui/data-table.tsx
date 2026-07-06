"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Columns3,
  Inbox,
  SlidersHorizontal,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/ui/pagination"
import { Search } from "@/components/ui/search"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type DataTableEmptyState = {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  loading?: boolean
  skeletonRows?: number
  emptyState?: DataTableEmptyState
  /** Global text filter across all columns with filterFn or accessor */
  enableFiltering?: boolean
  filterPlaceholder?: string
  enableSorting?: boolean
  enableColumnResizing?: boolean
  enableColumnVisibility?: boolean
  enablePagination?: boolean
  pageSize?: number
  enableRowSelection?: boolean
  bulkActions?: (selectedRows: TData[]) => React.ReactNode
  /** Virtualize when row count exceeds this threshold */
  virtualizationThreshold?: number
  stickyHeader?: boolean
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  onRowKeyActivate?: (row: TData) => void
  className?: string
  toolbar?: React.ReactNode
  caption?: string
  /** Hide table on small screens and show card layout using this render */
  mobileCardRender?: (row: TData, index: number) => React.ReactNode
  initialSorting?: SortingState
  initialColumnVisibility?: VisibilityState
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: import("@tanstack/react-table").Column<TData, TValue>
  title: string
}) {
  if (!column.getCanSort()) {
    return <span>{title}</span>
  }

  const sorted = column.getIsSorted()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1.5 px-2 font-semibold hover:bg-transparent"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" aria-hidden />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" aria-hidden />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />
      )}
    </Button>
  )
}

function DataTableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <TableCell key={`skeleton-${rowIndex}-${colIndex}`}>
              <Skeleton className="h-4 w-full max-w-[12rem]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function DataTableEmpty({ state }: { state: DataTableEmptyState }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)]">
        {state.icon ?? <Inbox className="size-6" aria-hidden />}
      </span>
      <h3 className="text-body-lg font-semibold text-[var(--text-primary)]">{state.title}</h3>
      {state.description ? (
        <p className="mt-2 max-w-sm text-body text-[var(--text-secondary)]">{state.description}</p>
      ) : null}
      {state.action ? <div className="mt-5">{state.action}</div> : null}
    </div>
  )
}

function DataTable<TData, TValue>({
  columns: userColumns,
  data,
  loading = false,
  skeletonRows = 5,
  emptyState,
  enableFiltering = true,
  filterPlaceholder = "Filter rows…",
  enableSorting = true,
  enableColumnResizing = true,
  enableColumnVisibility = true,
  enablePagination = true,
  pageSize = 10,
  enableRowSelection = false,
  bulkActions,
  virtualizationThreshold = 50,
  stickyHeader = true,
  getRowId,
  onRowClick,
  onRowKeyActivate,
  className,
  toolbar,
  caption,
  mobileCardRender,
  initialSorting = [],
  initialColumnVisibility = {},
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility)
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [focusedRowIndex, setFocusedRowIndex] = React.useState(-1)
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const selectionColumn = React.useMemo<ColumnDef<TData, TValue>>(
    () => ({
      id: "__select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 40,
    }),
    [],
  )

  const columns = React.useMemo(
    () => (enableRowSelection ? [selectionColumn, ...userColumns] : userColumns),
    [enableRowSelection, selectionColumn, userColumns],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableSorting,
    enableColumnResizing,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: { pageSize },
    },
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    globalFilterFn: "includesString",
  })

  const rows = table.getRowModel().rows
  const useVirtualization = rows.length > virtualizationThreshold
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 8,
    enabled: useVirtualization,
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original)
  const visibleColumnCount = table.getVisibleLeafColumns().length
  const showToolbar =
    enableFiltering || enableColumnVisibility || toolbar || (enableRowSelection && bulkActions)

  const handleRowKeyDown = React.useCallback(
    (event: React.KeyboardEvent, row: Row<TData>, index: number) => {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setFocusedRowIndex(Math.min(index + 1, rows.length - 1))
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setFocusedRowIndex(Math.max(index - 1, 0))
      } else if (event.key === "Enter" || event.key === " ") {
        if (event.key === " ") event.preventDefault()
        const activate = onRowKeyActivate ?? onRowClick
        activate?.(row.original)
      }
    },
    [onRowClick, onRowKeyActivate, rows.length],
  )

  React.useEffect(() => {
    if (focusedRowIndex < 0) return
    const rowEl = tableContainerRef.current?.querySelector<HTMLElement>(
      `[data-row-index="${focusedRowIndex}"]`,
    )
    rowEl?.focus()
  }, [focusedRowIndex])

  const renderRow = (row: Row<TData>, index: number, style?: React.CSSProperties) => (
    <TableRow
      key={row.id}
      data-row-index={index}
      data-state={row.getIsSelected() ? "selected" : undefined}
      tabIndex={focusedRowIndex === index ? 0 : -1}
      className={cn(
        onRowClick || onRowKeyActivate ? "cursor-pointer" : undefined,
        focusedRowIndex === index ? "ring-2 ring-inset ring-[var(--focus-ring-color)]" : undefined,
      )}
      style={style}
      onClick={() => onRowClick?.(row.original)}
      onKeyDown={(e) => handleRowKeyDown(e, row, index)}
      onFocus={() => setFocusedRowIndex(index)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          style={{
            width: cell.column.getSize(),
            maxWidth: cell.column.getSize(),
          }}
          className="truncate"
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )

  const tableContent = (
    <Table
      bare
      className={cn(enableColumnResizing ? "table-fixed" : undefined)}
      style={{ minWidth: table.getCenterTotalSize() }}
    >
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <TableHeader
        className={cn(
          stickyHeader ? "sticky top-0 z-10 bg-[var(--surface-primary)] shadow-[0_1px_0_var(--border-default)]" : undefined,
        )}
      >
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.getSize(), position: "relative" }}
                className="select-none"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
                {enableColumnResizing && header.column.getCanResize() ? (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "absolute -right-0.5 top-0 z-20 h-full w-1.5 cursor-col-resize touch-none",
                      "hover:bg-[var(--accent)]/30",
                      header.column.getIsResizing() ? "bg-[var(--accent)]/50" : undefined,
                    )}
                    aria-hidden
                  />
                ) : null}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {loading ? (
          <DataTableSkeleton columns={visibleColumnCount} rows={skeletonRows} />
        ) : rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={visibleColumnCount} className="p-0">
              <DataTableEmpty
                state={
                  emptyState ?? {
                    title: "No results",
                    description: globalFilter
                      ? "Try adjusting your filter."
                      : "There is nothing to show yet.",
                  }
                }
              />
            </TableCell>
          </TableRow>
        ) : useVirtualization ? (
          <>
            {virtualizer.getVirtualItems().length > 0 ? (
              <TableRow aria-hidden className="border-0 hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumnCount}
                  className="p-0"
                  style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }}
                />
              </TableRow>
            ) : null}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              return renderRow(row, virtualRow.index, { height: virtualRow.size })
            })}
            {virtualizer.getVirtualItems().length > 0 ? (
              <TableRow aria-hidden className="border-0 hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumnCount}
                  className="p-0"
                  style={{
                    height:
                      virtualizer.getTotalSize() -
                      (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                  }}
                />
              </TableRow>
            ) : null}
          </>
        ) : (
          rows.map((row, index) => renderRow(row, index))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className={cn("space-y-3", className)} ref={tableContainerRef}>
      {showToolbar ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {enableFiltering ? (
              <Search
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={filterPlaceholder}
                clearable
                onClear={() => setGlobalFilter("")}
                containerClassName="w-full sm:max-w-xs"
                aria-label="Filter table"
              />
            ) : null}
            {toolbar}
          </div>
          {enableColumnVisibility ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="shrink-0">
                  <Columns3 className="size-4" />
                  Columns
                  <ChevronDown className="size-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <SlidersHorizontal className="size-3.5" />
                  Toggle columns
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ) : null}

      {enableRowSelection && selectedRows.length > 0 && bulkActions ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-2.5">
          <span className="text-body font-medium tabular-nums">
            {selectedRows.length} selected
          </span>
          {bulkActions(selectedRows)}
        </div>
      ) : null}

      {mobileCardRender ? (
        <>
          <div className="md:hidden space-y-3">
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))
              : rows.length === 0
                ? (
                    <DataTableEmpty
                      state={
                        emptyState ?? {
                          title: "No results",
                          description: "There is nothing to show yet.",
                        }
                      }
                    />
                  )
                : rows.map((row, index) => (
                    <div key={row.id}>{mobileCardRender(row.original, index)}</div>
                  ))}
          </div>
          <div className="hidden md:block rounded-xl border border-[var(--border-default)]">
            {tableContent}
          </div>
        </>
      ) : (
        <div
          ref={useVirtualization ? parentRef : undefined}
          className={cn(
            "rounded-xl border border-[var(--border-default)]",
            useVirtualization ? "max-h-[min(70vh,640px)] overflow-auto" : undefined,
          )}
        >
          {tableContent}
        </div>
      )}

      {enablePagination && !loading && rows.length > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-caption text-[var(--text-tertiary)] tabular-nums">
            {table.getFilteredRowModel().rows.length} row
            {table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
            {globalFilter ? " (filtered)" : ""}
          </p>
          <Pagination
            page={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        </div>
      ) : null}
    </div>
  )
}

export { DataTable, DataTableColumnHeader }
