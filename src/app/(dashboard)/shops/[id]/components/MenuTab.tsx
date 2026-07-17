import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { shopsApi } from "@/lib/api/domains/shops";
import { formatSomUZS } from "@/lib/money";

interface MenuTabProps {
  shopId: number;
}

export function MenuTab({ shopId }: MenuTabProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  // Per-row pending set — a shared mutation's onSettled would race across rows,
  // so each toggle drives its own try/finally around mutateAsync instead.
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const { data: drinks, isLoading } = useQuery({
    queryKey: ["shop-drinks", shopId],
    queryFn: () => shopsApi.getDrinks(shopId),
    enabled: !!shopId,
  });

  const disableMutation = useMutation({
    mutationFn: ({ partnerDrinkId, disabled }: { partnerDrinkId: number; disabled: boolean }) =>
      shopsApi.setDrinkDisabled(shopId, partnerDrinkId, disabled),
  });

  const handleToggle = async (partnerDrinkId: number, disabled: boolean) => {
    setPendingIds((prev) => new Set(prev).add(partnerDrinkId));
    try {
      await disableMutation.mutateAsync({ partnerDrinkId, disabled });
      await queryClient.invalidateQueries({ queryKey: ["shop-drinks", shopId] });
      toast.success(disabled ? "Drink disabled at this shop" : "Drink enabled at this shop");
    } catch {
      toast.error("Failed to update drink availability");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(partnerDrinkId);
        return next;
      });
    }
  };

  const filteredDrinks = (drinks || []).filter((d) =>
    d.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="max-w-sm w-full relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter drinks…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu availability</CardTitle>
          <CardDescription>
            Disable a drink at just this shop without affecting the rest of the partner&apos;s menu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock (POS)</TableHead>
                  <TableHead className="w-[160px]">Available at shop</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredDrinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        title="No drinks found"
                        description={filter ? "Try a different search term." : "This shop's partner has no drinks yet."}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrinks.map((drink) => {
                    const isPending = pendingIds.has(drink.partner_drink_id);
                    return (
                      <TableRow key={drink.partner_drink_id}>
                        <TableCell>
                          {drink.picture_url ? (
                            <img
                              src={drink.picture_url}
                              alt={drink.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs">
                              No Img
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{drink.name}</TableCell>
                        <TableCell>
                          {drink.product_price != null ? formatSomUZS(drink.product_price, { suffix: "UZS" }) : "-"}
                        </TableCell>
                        <TableCell>
                          {drink.out_of_stock ? (
                            <div className="space-y-0.5">
                              <Badge variant="destructive">Out of stock</Badge>
                              {drink.out_of_stock_until && (
                                <p className="text-xs text-muted-foreground">
                                  Until {drink.out_of_stock_until}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline">In stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!drink.disabled}
                              onCheckedChange={(checked) => handleToggle(drink.partner_drink_id, !checked)}
                              disabled={isPending}
                              aria-label={drink.disabled ? "Enable drink at this shop" : "Disable drink at this shop"}
                            />
                            <span className="text-xs text-muted-foreground">
                              {drink.disabled ? "Disabled" : "Enabled"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </DataTableShell>
        </CardContent>
      </Card>
    </div>
  );
}
