"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, Coffee, ChevronLeft, ChevronRight } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { drinksApi } from "@/lib/api/domains/drinks";
import type { Drink, CreateDrinkRequest } from "@/lib/api/schemas/drinks";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DrinksPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  const { data: drinksData = { data: [] }, isLoading } = useQuery({
    queryKey: ["drinks"],
    queryFn: drinksApi.getAll,
  });

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
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDrinkRequest> }) =>
      drinksApi.update(id, data),
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

  const filteredDrinks = (drinksData.data || []).filter((drink) =>
    drink.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDrinks.length / ITEMS_PER_PAGE);
  const paginatedDrinks = filteredDrinks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Drink</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredDrinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No drinks found
                </TableCell>
              </TableRow>
            ) : (
              paginatedDrinks.map((drink) => (
                <TableRow key={drink.id}>
                  <TableCell>
                    {drink.imageUrl ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                        <Image
                          src={drink.imageUrl}
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
                  <TableCell className="text-muted-foreground">#{drink.id}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditDrink(drink);
                          setFormData({ name: drink.name });
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(drink.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Edit Dialog */}
      <Dialog open={!!editDrink} onOpenChange={() => setEditDrink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Drink</DialogTitle>
            <DialogDescription>Update drink information</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editDrink) updateMutation.mutate({ id: editDrink.id, data: formData }); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="Drink name" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDrink(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
