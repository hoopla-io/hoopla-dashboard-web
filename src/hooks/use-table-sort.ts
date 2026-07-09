import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

import type { SortOrder } from "@/lib/api/types";

export function nextSortState(
  sort: string,
  order: SortOrder,
  column: string
): { sort: string | null; order: SortOrder | null } {
  if (sort !== column) return { sort: column, order: "asc" };
  if (order === "asc") return { sort: column, order: "desc" };
  return { sort: null, order: null };
}

export function useTableSort(onChange?: () => void) {
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault(""));
  const [order, setOrder] = useQueryState(
    "order",
    parseAsStringEnum<SortOrder>(["asc", "desc"]).withDefault("asc")
  );

  const onSort = (column: string) => {
    const next = nextSortState(sort, order, column);
    setSort(next.sort);
    setOrder(next.order);
    onChange?.();
  };

  return {
    sort,
    order,
    onSort,
    sortParam: sort || undefined,
    orderParam: sort ? order : undefined,
  };
}
