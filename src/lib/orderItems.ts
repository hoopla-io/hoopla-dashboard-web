import type { Order } from "@/lib/api/schemas/orders";

export type OrderItem = NonNullable<Order["items"]>[number];

export interface GroupedDrink {
  drink: OrderItem;
  modifiers: OrderItem[];
}

/**
 * Groups an order's flat item list into one entry per distinct drink, with
 * its modifiers attached — keyed on parent_item_id rather than array order,
 * so it's correct regardless of how the backend orders the rows.
 */
export function groupOrderItems(items: OrderItem[] | undefined): GroupedDrink[] {
  if (!items) return [];
  const drinks = items.filter((item) => item.type === "drink");

  const modifiersByParent = new Map<number, OrderItem[]>();
  for (const item of items) {
    if (item.type !== "modifier" || item.parent_item_id == null) continue;
    const list = modifiersByParent.get(item.parent_item_id) ?? [];
    list.push(item);
    modifiersByParent.set(item.parent_item_id, list);
  }

  return drinks.map((drink) => ({
    drink,
    modifiers: modifiersByParent.get(drink.id) ?? [],
  }));
}

/**
 * Number of distinct drinks on an order — NOT items.length, which also
 * counts modifier rows. A single customized drink (1 drink + N modifiers)
 * is not a "multi-item" order.
 */
export function distinctDrinkCount(items: OrderItem[] | undefined): number {
  if (!items) return 0;
  return items.filter((item) => item.type === "drink").length;
}
