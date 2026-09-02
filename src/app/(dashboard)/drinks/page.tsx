
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Image from "@/components/ui/image";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { drinksApi } from "@/lib/api/domains/drinks";
import type { Drink, CreateDrinkRequest } from "@/lib/api/schemas/drinks";

function DrinksContent() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() =>
    setCurrentPage(1)
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      queueMicrotask(() => setIsCreateOpen(true));
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      navigate(`/products?${params.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const [editDrink, setEditDrink] = useState<Drink | null>(null);
  const [formData, setFormData] = useState<CreateDrinkRequest>({ name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: drinksData, isLoading } = useQuery({
    queryKey: ["drinks", currentPage, search, perPage, sortParam, orderParam],
    queryFn: () =>
      drinksApi.getAll({
        page: currentPage,
        limit: perPage,
        search: search || undefined,
        sort: sortParam,
        order: orderParam,
      }),
  });

  const drinks = drinksData?.data || [];
  const meta = drinksData?.meta;
  const totalPages = meta?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateDrinkRequest; file: File }) =>
      drinksApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Product created");
      setIsCreateOpen(false);
      setFormData({ name: "", description: "" });
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: number;
      data: Partial<CreateDrinkRequest>;
      file?: File;
    }) => drinksApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Product updated");
      setEditDrink(null);
    },
    onError: () => toast.error("Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: drinksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      toast.success("Product deleted");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage the beverage catalog used by every partner shop."
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            Add product
          </Button>
        }
      />

      <PageToolbar>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value || null);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead className="w-[64px]" column="id" sort={sort} order={order} onSort={onSort}>
                ID
              </SortableTableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <SortableTableHead column="name" sort={sort} order={order} onSort={onSort}>
                Name
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : drinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    title="No products found"
                    description={
                      search
                        ? "Try a different search term."
                        : "Add your first product to populate the catalog."
                    }
                    action={
                      !search ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCreateOpen(true)}
                        >
                          <Plus className="size-4" />
                          Add product
                        </Button>
                      ) : null
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              drinks.map((drink) => (
                <TableRow key={drink.id}>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{drink.id}
                  </TableCell>
                  <TableCell>
                    {drink.image_url ? (
                      <button
                        type="button"
                        className="relative size-10 overflow-hidden rounded-md ring-1 ring-border transition-opacity hover:opacity-80"
                        onClick={() => setPreviewImage(drink.image_url!)}
                      >
                        <Image
                          src={drink.image_url}
                          alt={drink.name}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {drink.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditDrink(drink);
                          setFormData({ name: drink.name, description: drink.description ?? "" });
                          setSelectedFile(null);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(drink.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
      </DataTableShell>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create product</DialogTitle>
            <DialogDescription>Add a new beverage to the catalog.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedFile) {
                toast.error("Image is required");
                return;
              }
              createMutation.mutate({ data: formData, file: selectedFile });
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Default description shown to customers"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Image preview</DialogTitle>
            <DialogDescription>Product image preview</DialogDescription>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Product preview"
              className="h-auto w-full rounded"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editDrink}
        onOpenChange={(open) => {
          if (!open) {
            setEditDrink(null);
            setSelectedFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>Update product information.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editDrink) {
                updateMutation.mutate({
                  id: editDrink.id,
                  data: formData,
                  file: selectedFile || undefined,
                });
              }
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Default description shown to customers"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to remove the default description.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Image</Label>
                <div className="flex items-center gap-4">
                  {editDrink && (
                    <div className="relative size-14 overflow-hidden rounded-md border border-border">
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
                        <div className="flex size-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to keep current image.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDrink(null);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
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
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading products…
        </div>
      }
    >
      <DrinksContent />
    </Suspense>
  );
}
