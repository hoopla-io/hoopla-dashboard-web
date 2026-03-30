"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, Coffee } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { categoryApi } from "@/lib/api/domains/drinks";
import type { DrinkCategory, CategoryWithDrinks } from "@/lib/api/schemas/drinks";

function DrinkCategoriesContent() {
  const queryClient = useQueryClient();

  const [editingCategory, setEditingCategory] = useState<DrinkCategory | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");

  const [viewCategory, setViewCategory] = useState<DrinkCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["drink_categories"],
    queryFn: categoryApi.getAll,
  });

  const { data: categoryDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["drink_categories", viewCategory?.id],
    queryFn: () => categoryApi.getById(viewCategory!.id),
    enabled: !!viewCategory,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => categoryApi.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drink_categories"] });
      toast.success("Category created successfully!");
      setIsCreateOpen(false);
      setFormName("");
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => categoryApi.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drink_categories"] });
      toast.success("Category updated successfully!");
      setEditingCategory(null);
      setFormName("");
    },
    onError: () => toast.error("Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: categoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drink_categories"] });
      toast.success("Category deleted successfully!");
    },
    onError: () => toast.error("Failed to delete category"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Drink Categories</h1>
          <p className="text-muted-foreground">Manage drink category tags</p>
        </div>
        <Button onClick={() => { setFormName(""); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
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
                        onClick={() => setViewCategory(category)}
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

      {/* View Drinks Dialog */}
      <Dialog open={!!viewCategory} onOpenChange={(open) => { if (!open) setViewCategory(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewCategory?.name} — Drinks</DialogTitle>
            <DialogDescription>Drinks linked to this category</DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-80 overflow-y-auto">
            {isDetailLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading...</p>
            ) : !categoryDetail?.drinks || categoryDetail.drinks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No drinks linked to this category</p>
            ) : (
              <div className="space-y-2">
                {categoryDetail.drinks.map((drink) => (
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
                    <div>
                      <p className="text-sm font-medium">{drink.name}</p>
                      <p className="text-xs text-muted-foreground">#{drink.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCategory(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DrinkCategoriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading categories...</div>}>
      <DrinkCategoriesContent />
    </Suspense>
  );
}
