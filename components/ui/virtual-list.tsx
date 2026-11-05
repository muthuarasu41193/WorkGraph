"use client";

import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

type VirtualListProps<T> = {
  items: T[];
  estimateSize: number;
  overscan?: number;
  className?: string;
  /** Accessible name for the scroll region. */
  "aria-label"?: string;
  getItemKey?: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
};

/**
 * Fixed-estimate virtual scroller for lists over ~50 rows.
 * DataTable and dense feeds should prefer this over mounting every row.
 */
export function VirtualList<T>({
  items,
  estimateSize,
  overscan = 8,
  className,
  "aria-label": ariaLabel = "List",
  getItemKey,
  renderItem,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={cn("h-full overflow-auto", className)}
      role="list"
      aria-label={ariaLabel}
      aria-rowcount={items.length}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const item = items[row.index];
          const key = getItemKey?.(item, row.index) ?? row.key;
          return (
            <div
              key={key}
              role="listitem"
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${row.size}px`,
                transform: `translateY(${row.start}px)`,
              }}
            >
              {renderItem(item, row.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
