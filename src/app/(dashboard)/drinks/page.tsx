"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, Coffee } from "lucide-react";

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
import { drinksApi } from "@/lib/api";
import type { Drink, CreateDrinkRequest } from "@/lib/api";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DrinksPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Check for action param on mount
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/drinks?${params.toString()}`);
    }
  }, [searchParams, router]);
  const [editDrink, setEditDrink] = useState<Drink | null>(null);
  const [formData, setFormData] = useState<CreateDrinkRequest>({ name: "" });

  const { data: drinks = [], isLoading } = useQuery({
    queryKey: ["drinks"],
    queryFn: drinksApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDrinkRequest) => drinksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Drink created successfully!");
      setIsCreateOpen(false);
      setFormData({ name: "" });
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

  const filteredDrinks = drinks.filter((drink) =>
    drink.name.toLowerCase().includes(search.toLowerCase())
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
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Drink</TableHead>
              <TableHead>ID</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredDrinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No drinks found
                </TableCell>
              </TableRow>
            ) : (
              filteredDrinks.map((drink) => (
                <TableRow key={drink.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Coffee className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{drink.name}</span>
                    </div>
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="Drink name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDrink} onOpenChange={() => setEditDrink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Drink</DialogTitle>
            <DialogDescription>Update drink information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ name: e.target.value })} placeholder="Drink name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDrink(null)}>Cancel</Button>
            <Button onClick={() => editDrink && updateMutation.mutate({ id: editDrink.id, data: formData })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
