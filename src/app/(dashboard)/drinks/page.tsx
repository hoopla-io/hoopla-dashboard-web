"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Coffee, Tag, X } from "lucide-react";
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
import { drinksApi, categoryApi } from "@/lib/api/domains/drinks";
import type { Drink, CreateDrinkRequest } from "@/lib/api/schemas/drinks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { PaginationControls } from "@/components/ui/pagination-controls";

function DrinksContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withOptions({ throttleMs: 500 }).withDefault(""));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [manageCategoriesDrink, setManageCategoriesDrink] = useState<Drink | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      // eslint-disable-next-line
      setIsCreateOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/drinks?${params.toString()}`);
    }
  }, [searchParams, router]);
  const [editDrink, setEditDrink] = useState<Drink | null>(null);
  const [formData, setFormData] = useState<CreateDrinkRequest>({ name: "" });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: drinksData, isLoading } = useQuery({
    queryKey: ["drinks", currentPage, search, perPage],
    queryFn: () => drinksApi.getAll({ 
        page: currentPage, 
        limit: perPage,
        search: search || undefined 
    }),
  });

  const drinks = drinksData?.data || [];
  const meta = drinksData?.meta;
  const totalPages = meta?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateDrinkRequest; file: File }) => drinksApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Drink created successfully!");
      setIsCreateOpen(false);
      setFormData({ name: "" });
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to create drink"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateDrinkRequest>; file?: File }) =>
      drinksApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Drink updated successfully!");
      setEditDrink(null);
    },
    onError: () => toast.error("Failed to update drink"),
  });

  const deleteMutation = useMutation({
    mutationFn: drinksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Drink deleted successfully!");
    },
    onError: () => toast.error("Failed to delete drink"),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["drink_categories"],
    queryFn: categoryApi.getAll,
  });

  const linkCategoryMutation = useMutation({
    mutationFn: ({ drinkId, categoryId }: { drinkId: number; categoryId: number }) =>
      categoryApi.linkDrink({ drink_id: drinkId, category_id: categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      setSelectedCategoryId("");
      toast.success("Category linked!");
    },
    onError: () => toast.error("Failed to link category"),
  });

  const unlinkCategoryMutation = useMutation({
    mutationFn: ({ drinkId, categoryId }: { drinkId: number; categoryId: number }) =>
      categoryApi.unlinkDrink(drinkId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Category unlinked!");
    },
    onError: () => toast.error("Failed to unlink category"),
  });



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Drinks</h1>
          <p className="text-muted-foreground">Manage beverage catalog</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Drink
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search drinks..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value || null);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Drink</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : drinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No drinks found
                </TableCell>
              </TableRow>
            ) : (
              drinks.map((drink) => (
                <TableRow key={drink.id}>
                  <TableCell className="text-muted-foreground">#{drink.id}</TableCell>
                  <TableCell>
                    {drink.image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                        <Image
                          src={drink.image_url}
                          alt={drink.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Coffee className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{drink.name}</span>
                  </TableCell>
                  <TableCell>
                    {drink.categories && drink.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {drink.categories.map((cat) => (
                          <span key={cat.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            <Tag className="h-3 w-3" />
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        title="Manage categories"
                        onClick={() => {
                          setManageCategoriesDrink(drink);
                          setSelectedCategoryId("");
                        }}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                       <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => {
                          setEditDrink(drink);
                          setFormData({ name: drink.name });
                          setSelectedFile(null); // Clear any previous file selection
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive cursor-pointer"
                        onClick={() => deleteMutation.mutate(drink.id)}
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
      
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        perPage={perPage}
        onPerPageChange={(v) => {
            setPerPage(v);
            setCurrentPage(1);
        }}
        isLoading={isLoading}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Drink</DialogTitle>
            <DialogDescription>Add a new beverage</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!selectedFile) {
              toast.error("Image is required");
              return;
            }
            createMutation.mutate({ data: formData, file: selectedFile });
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="Drink name" required />
              </div>
              <div className="space-y-2">
                <Label>Image (Required)</Label>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }} 
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

      {/* Manage Categories Dialog */}
      <Dialog open={!!manageCategoriesDrink} onOpenChange={(open) => {
        if (!open) { setManageCategoriesDrink(null); setSelectedCategoryId(""); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories — {manageCategoriesDrink?.name}</DialogTitle>
            <DialogDescription>Link or unlink drink categories</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Current categories</p>
              {!manageCategoriesDrink?.categories || manageCategoriesDrink.categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories linked</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {manageCategoriesDrink.categories.map((cat) => (
                    <span key={cat.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium">
                      <Tag className="h-3 w-3" />
                      {cat.name}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive cursor-pointer"
                        onClick={() => {
                          unlinkCategoryMutation.mutate(
                            { drinkId: manageCategoriesDrink.id, categoryId: cat.id },
                            {
                              onSuccess: () => {
                                setManageCategoriesDrink((prev) =>
                                  prev ? { ...prev, categories: prev.categories?.filter((c) => c.id !== cat.id) ?? null } : null
                                );
                              },
                            }
                          );
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Link a category</p>
              <div className="flex gap-2">
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories
                      .filter((c) => !manageCategoriesDrink?.categories?.some((mc) => mc.id === c.id))
                      .map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={!selectedCategoryId || linkCategoryMutation.isPending}
                  onClick={() => {
                    if (!manageCategoriesDrink || !selectedCategoryId) return;
                    const catId = Number(selectedCategoryId);
                    linkCategoryMutation.mutate(
                      { drinkId: manageCategoriesDrink.id, categoryId: catId },
                      {
                        onSuccess: () => {
                          const linkedCat = allCategories.find((c) => c.id === catId);
                          if (linkedCat) {
                            setManageCategoriesDrink((prev) =>
                              prev ? { ...prev, categories: [...(prev.categories ?? []), linkedCat] } : null
                            );
                          }
                        },
                      }
                    );
                  }}
                >
                  Link
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setManageCategoriesDrink(null); setSelectedCategoryId(""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDrink} onOpenChange={(open) => {
        if (!open) {
          setEditDrink(null);
          setSelectedFile(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Drink</DialogTitle>
            <DialogDescription>Update drink information</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            if (editDrink) {
              updateMutation.mutate({ 
                id: editDrink.id, 
                data: formData,
                file: selectedFile || undefined
              });
            } 
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="Drink name" />
              </div>
              
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-4">
                  {editDrink && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                      {selectedFile ? (
                        <Image
                          src={URL.createObjectURL(selectedFile)}
                          alt="New preview"
                          fill
                          className="object-cover"
                        />
                      ) : editDrink.image_url ? (
                         <Image
                          src={editDrink.image_url}
                          alt={editDrink.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Coffee className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1">
                     <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }} 
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>
                  </div>
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditDrink(null);
                setSelectedFile(null);
              }}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DrinksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading drinks...</div>}>
      <DrinksContent />
    </Suspense>
  );
}
