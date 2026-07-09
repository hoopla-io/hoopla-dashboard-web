import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

import type { SortOrder } from "@/lib/api/types";

export function useTableSort(onChange?: () => void) {
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault(""));
  const [order, setOrder] = useQueryState(
    "order",
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
