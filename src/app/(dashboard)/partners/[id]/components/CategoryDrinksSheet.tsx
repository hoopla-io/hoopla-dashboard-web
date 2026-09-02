import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Coffee, Search } from "lucide-react";
import Image from "@/components/ui/image";

import { formatUZS } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { categoryApi, drinksApi } from "@/lib/api/domains/drinks";
import type { DrinkCategory, PartnerDrink } from "@/lib/api/schemas/drinks";

interface CategoryDrinksSheetProps {
  partnerId: number;
  category: DrinkCategory;
  categories: DrinkCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function drinkLabel(pd: PartnerDrink): string {
  return pd.vendor_product_name || pd.name || pd.drink?.name || `#${pd.id}`;
}

export function CategoryDrinksSheet({
  partnerId,
  category,
  categories,
  open,
  onOpenChange,
}: CategoryDrinksSheetProps) {
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map());
  const [search, setSearch] = useState("");

  const { data: partnerDrinks = [], isLoading } = useQuery({
    queryKey: ["partner_drinks", partnerId],
    queryFn: () => drinksApi.getByPartner(partnerId),
  });

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const isServerAttached = (pd: PartnerDrink) =>
    pd.category_ids?.includes(category.id) ?? false;

  const isEffectivelyAttached = (pd: PartnerDrink) =>
    overrides.get(pd.id) ?? isServerAttached(pd);

  const attachedCount = useMemo(
    () => partnerDrinks.filter(isServerAttached).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [partnerDrinks, category.id]
  );

  const sortedDrinks = useMemo(() => {
    return [...partnerDrinks].sort((a, b) => {
      const attachedDiff = Number(isServerAttached(b)) - Number(isServerAttached(a));
      if (attachedDiff !== 0) return attachedDiff;
      return drinkLabel(a).localeCompare(drinkLabel(b));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerDrinks, category.id]);

  const visibleDrinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedDrinks;
    return sortedDrinks.filter((pd) => drinkLabel(pd).toLowerCase().includes(q));
  }, [sortedDrinks, search]);

  const toggle = (pd: PartnerDrink) => {
    const server = isServerAttached(pd);
    const next = !isEffectivelyAttached(pd);
    setOverrides((prev) => {
      const copy = new Map(prev);
      if (next === server) {
        copy.delete(pd.id);
      } else {
        copy.set(pd.id, next);
      }
      return copy;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const toAdd: number[] = [];
      const toRemove: number[] = [];
      overrides.forEach((attached, id) => (attached ? toAdd : toRemove).push(id));

      const results = await Promise.allSettled([
        ...(toAdd.length
          ? [categoryApi.linkDrink({ category_id: category.id, partner_drink_ids: toAdd })]
          : []),
        ...toRemove.map((id) => categoryApi.unlinkDrink(id, category.id)),
      ]);
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) throw new Error(`${failed} of ${results.length} operations failed`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drinks", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["partner_categories", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["partner_category_detail", category.id] });
    },
    onSuccess: () => {
      toast.success("Category products updated!");
      setOverrides(new Map());
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(`Some changes failed to apply — list refreshed. ${e.message}`);
      setOverrides(new Map());
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next && overrides.size > 0 && !saveMutation.isPending) {
      if (!window.confirm("Discard unsaved changes?")) return;
    }
    if (!next) setOverrides(new Map());
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>{category.name}</SheetTitle>
          <SheetDescription>
            {attachedCount} {attachedCount === 1 ? "product" : "products"} attached
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-4">
          {isLoading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : partnerDrinks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products for this partner yet. Add them in the Products tab.
            </p>
          ) : visibleDrinks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products match &quot;{search}&quot;
            </p>
          ) : (
            <div className="space-y-2 py-2">
              {visibleDrinks.map((pd) => {
                const checked = isEffectivelyAttached(pd);
                const changed = overrides.has(pd.id);
                const badgeIds = pd.category_ids ?? [];
                return (
                  <div
                    key={pd.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(pd)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(pd);
                      }
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-accent/50 ${
                      changed ? "bg-primary/5" : ""
                    }`}
                  >
                    <Checkbox checked={checked} className="pointer-events-none" tabIndex={-1} />
                    {pd.image_url ? (
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                        <Image src={pd.image_url} alt={drinkLabel(pd)} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                        <Coffee className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{drinkLabel(pd)}</p>
                      <div className="flex flex-wrap items-center gap-1">
                        {pd.product_price != null && (
                          <span className="text-xs text-muted-foreground">
                            {formatUZS(pd.product_price)} UZS
                          </span>
                        )}
                        {badgeIds.map((id) => {
                          const name = categoryNameById.get(id);
                          if (!name) return null;
                          return (
                            <Badge
                              key={id}
                              variant={id === category.id ? "default" : "outline"}
                              className="text-[10px]"
                            >
                              {name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="flex-row justify-end gap-2 border-t">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={overrides.size === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : `Save changes (${overrides.size})`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
