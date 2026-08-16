import { useCallback, useEffect, useState } from "react";

/**
 * Local drag&drop reordering state for a table of rows, mirroring the pattern
 * first built for drink categories (CategoriesTab): the server list is the
 * source of truth, `order` is the admin's working copy, `isDirty` says whether
 * it differs, and the caller decides when to persist (Save button) or `reset`.
 *
 * Rows are matched by `getKey`. When the server list changes (refetch after
 * save, create, delete) the working copy is replaced unless it is the same
 * sequence of keys — so an in-progress unsaved drag survives unrelated
 * refetches but a saved/changed list wins.
 */
export function useDragReorder<T, K extends string | number>(items: T[], getKey: (item: T) => K) {
  const [order, setOrder] = useState<T[]>(items);
  const [dragKey, setDragKey] = useState<K | null>(null);

  useEffect(() => {
    setOrder((prev) => {
      const sameKeys =
        prev.length === items.length && prev.every((it, i) => getKey(it) === getKey(items[i]!));
      return sameKeys ? prev : items;
    });
    // getKey is expected to be stable (module-level or inline pure fn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const isDirty =
    order.length === items.length && order.some((it, i) => getKey(it) !== getKey(items[i]!));

  const move = useCallback(
    (fromKey: K, toKey: K) => {
      if (fromKey === toKey) return;
      setOrder((prev) => {
        const from = prev.findIndex((it) => getKey(it) === fromKey);
        const to = prev.findIndex((it) => getKey(it) === toKey);
        if (from === -1 || to === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved!);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const reset = useCallback(() => setOrder(items), [items]);

  /** Props to spread on a draggable row for the given key. */
  const rowProps = (key: K, enabled = true) =>
    enabled
      ? {
          draggable: true,
          onDragStart: () => setDragKey(key),
          onDragOver: (e: React.DragEvent) => e.preventDefault(),
          onDrop: () => {
            if (dragKey !== null) move(dragKey, key);
            setDragKey(null);
          },
          onDragEnd: () => setDragKey(null),
          className: `cursor-grab ${dragKey === key ? "opacity-50" : ""}`,
        }
      : {};

  return { order, isDirty, move, reset, dragKey, rowProps };
}
