import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, Coffee, X, GripVertical, Save, RotateCcw } from "lucide-react";
import Image from "@/components/ui/image";

import { formatUZS } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { categoryApi, drinksApi } from "@/lib/api/domains/drinks";
import type { DrinkCategory } from "@/lib/api/schemas/drinks";

interface CategoriesTabProps {
  partnerId: number;
}

export function CategoriesTab({ partnerId }: CategoriesTabProps) {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DrinkCategory | null>(null);
  const [formName, setFormName] = useState("");

  const [viewCategory, setViewCategory] = useState<DrinkCategory | null>(null);
  const [selectedDrinkIds, setSelectedDrinkIds] = useState<number[]>([]);

  const toggleSelectDrink = (id: number) =>
    setSelectedDrinkIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["partner_categories", partnerId],
    queryFn: () => categoryApi.getAll(partnerId),
  });

  const [order, setOrder] = useState<DrinkCategory[]>([]);
  const [dragId, setDragId] = useState<number | null>(null);

  useEffect(() => {
    setOrder((prev) => {
      const sameIds =
        prev.length === categories.length &&
        prev.every((c, i) => c.id === categories[i]?.id);
      return sameIds ? prev : categories;
    });
  }, [categories]);

  const isDirty =
    order.length === categories.length &&
    order.some((c, i) => c.id !== categories[i]?.id);

  const moveCategory = (fromId: number, toId: number) => {
    if (fromId === toId) return;
    setOrder((prev) => {
      const from = prev.findIndex((c) => c.id === fromId);
      const to = prev.findIndex((c) => c.id === toId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const reorderMutation = useMutation({
    mutationFn: (categoryIds: number[]) =>
      categoryApi.reorder({ partner_id: partnerId, category_ids: categoryIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_categories", partnerId] });
      toast.success("Category order saved!");
    },
    onError: () => toast.error("Failed to save order"),
  });

  const { data: categoryDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["partner_category_detail", viewCategory?.id],
    queryFn: () => categoryApi.getById(viewCategory!.id),
    enabled: !!viewCategory,
  });

  const { data: partnerDrinks = [] } = useQuery({
    queryKey: ["partner_drinks", partnerId],
    queryFn: () => drinksApi.getByPartner(partnerId),
    enabled: !!viewCategory,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => categoryApi.create({ partner_id: partnerId, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_categories", partnerId] });
      toast.success("Category created successfully!");
      setIsCreateOpen(false);
      setFormName("");
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => categoryApi.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_categories", partnerId] });
      toast.success("Category updated successfully!");
      setEditingCategory(null);
      setFormName("");
    },
    onError: () => toast.error("Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_categories", partnerId] });
      toast.success("Category deleted successfully!");
    },
    onError: () => toast.error("Failed to delete category"),
  });

  const linkMutation = useMutation({
    mutationFn: (partnerDrinkIds: number[]) =>
      categoryApi.linkDrink({ category_id: viewCategory!.id, partner_drink_ids: partnerDrinkIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_category_detail", viewCategory?.id] });
      setSelectedDrinkIds([]);
      toast.success("Drinks linked!");
    },
    onError: () => toast.error("Failed to link drinks"),
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ partnerDrinkId, categoryId }: { partnerDrinkId: number; categoryId: number }) =>
      categoryApi.unlinkDrink(partnerDrinkId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_category_detail", viewCategory?.id] });
      toast.success("Drink unlinked!");
    },
    onError: () => toast.error("Failed to unlink drink"),
  });

  // Offer only drinks that aren't in ANY category yet — these are the ones the
  // app shows under "Other". Drinks already in this (or another) category are
  // excluded so each drink is linked from its uncategorized state.
  const availableDrinks = partnerDrinks.filter((pd) => (pd.category_ids?.length ?? 0) === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Drink Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage categories for this partner. Drag rows to set the order shown in the app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <>
              <Button
                variant="outline"
                onClick={() => setOrder(categories)}
                disabled={reorderMutation.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={() => reorderMutation.mutate(order.map((c) => c.id))}
                disabled={reorderMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {reorderMutation.isPending ? "Saving..." : "Save order"}
              </Button>
            </>
          )}
          <Button onClick={() => { setFormName(""); setIsCreateOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : order.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              order.map((category) => (
                <TableRow
                  key={category.id}
                  draggable
                  onDragStart={() => setDragId(category.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragId !== null) moveCategory(dragId, category.id);
                    setDragId(null);
                  }}
                  onDragEnd={() => setDragId(null)}
                  className={`cursor-grab ${dragId === category.id ? "opacity-50" : ""}`}
                >
                  <TableCell className="text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </TableCell>
                  <TableCell className="text-muted-foreground">#{category.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer text-xs"
                        onClick={() => { setViewCategory(category); setSelectedDrinkIds([]); }}
                      >
                        Drinks
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => {
                          setEditingCategory(category);
                          setFormName(category.name);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive cursor-pointer"
                        onClick={() => deleteMutation.mutate(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new drink category</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (formName.trim()) createMutation.mutate(formName.trim());
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Coffee, Sugar Free"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => { if (!open) setEditingCategory(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category name</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingCategory && formName.trim()) {
              updateMutation.mutate({ id: editingCategory.id, name: formName.trim() });
            }
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Category name"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View & Link Drinks Dialog */}
      <Dialog open={!!viewCategory} onOpenChange={(open) => { if (!open) setViewCategory(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewCategory?.name} — Drinks</DialogTitle>
            <DialogDescription>Manage drinks linked to this category</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="max-h-60 overflow-y-auto">
              {isDetailLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : !categoryDetail?.partner_drinks || categoryDetail.partner_drinks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No drinks linked to this category</p>
              ) : (
                <div className="space-y-2">
                  {categoryDetail.partner_drinks.map((drink) => (
                    <div key={drink.id} className="flex items-center gap-3 rounded-lg border p-2">
                      {drink.image_url ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-md flex-shrink-0">
                          <Image src={drink.image_url} alt={drink.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted flex-shrink-0">
                          <Coffee className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{drink.vendor_product_name || drink.name}</p>
                        {drink.product_price != null && (
                          <p className="text-xs text-muted-foreground">{formatUZS(drink.product_price)} UZS</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => unlinkMutation.mutate({ partnerDrinkId: drink.id, categoryId: viewCategory!.id })}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Link drinks</p>
              {availableDrinks.length === 0 ? (
                <p className="text-xs text-muted-foreground">All drinks are already linked to this category.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                    {availableDrinks.map((pd) => {
                      const selected = selectedDrinkIds.includes(pd.id);
                      const label = pd.vendor_product_name || pd.name || pd.drink?.name || `#${pd.id}`;
                      return (
                        <Badge
                          key={pd.id}
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer select-none"
                          onClick={() => toggleSelectDrink(pd.id)}
                        >
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={selectedDrinkIds.length === 0 || linkMutation.isPending}
                    onClick={() => {
                      if (!viewCategory || selectedDrinkIds.length === 0) return;
                      linkMutation.mutate(selectedDrinkIds);
                    }}
                  >
                    {linkMutation.isPending
                      ? "Linking..."
                      : `Link${selectedDrinkIds.length > 0 ? ` (${selectedDrinkIds.length})` : ""}`}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCategory(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
