import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";
import type { SortOrder } from "@/lib/api/types";

interface SortableTableHeadProps
  extends Omit<React.ComponentProps<typeof TableHead>, "onClick"> {
  column: string;
  sort: string;
  order: SortOrder;
  onSort: (column: string) => void;
  align?: "left" | "right";
}

export function SortableTableHead({
  column,
  sort,
  order,
  onSort,
  align = "left",
  className,
  children,
  ...props
}: SortableTableHeadProps) {
  const active = sort === column;
  const Icon = active ? (order === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <TableHead
      className={cn("p-0", className)}
      aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}
      {...props}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "flex h-10 w-full items-center gap-1 px-4 transition-colors hover:text-foreground",
          align === "right" ? "justify-end" : "justify-start",
          active && "text-foreground"
        )}
      >
        {children}
        <Icon className={cn("size-3 shrink-0", active ? "opacity-100" : "opacity-40")} />
      </button>
    </TableHead>
  );
}
