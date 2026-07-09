import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

import type { SortOrder } from "@/lib/api/types";

interface UseTableSortOptions {
  sortKey?: string;
  orderKey?: string;
  onChange?: () => void;
}

export function useTableSort(onChangeOrOptions?: (() => void) | UseTableSortOptions) {
  const options =
    typeof onChangeOrOptions === "function"
      ? { onChange: onChangeOrOptions }
      : onChangeOrOptions || {};
  const { sortKey = "sort", orderKey = "order", onChange } = options;

  const [sort, setSort] = useQueryState(sortKey, parseAsString.withDefault(""));
  const [order, setOrder] = useQueryState(
    orderKey,
    parseAsStringEnum<SortOrder>(["asc", "desc"]).withDefault("asc")
  );

  const onSort = (column: string) => {
    if (sort !== column) {
      setSort(column);
      setOrder("asc");
    } else if (order === "asc") {
      setOrder("desc");
    } else {
      setSort(null);
      setOrder(null);
    }
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
