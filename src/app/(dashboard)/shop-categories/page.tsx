"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LayoutGrid, Building2, X } from "lucide-react";
import Image from "next/image";
import { useQueryState, parseAsInteger } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { shopCategoriesApi } from "@/lib/api/domains/shop-categories";
import { partnersApi } from "@/lib/api/domains/partners";
import type { ShopCategory, CreateShopCategoryRequest } from "@/lib/api/schemas/shop-categories";

const defaultForm: CreateShopCategoryRequest = {
  name: "",
  sort_order: 0,
  is_active: true,
};

function ShopCategoriesContent() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(20));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ShopCategory | null>(null);
  const [formData, setFormData] = useState<CreateShopCategoryRequest>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [viewCategory, setViewCategory] = useState<ShopCategory | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["shop-categories", currentPage, perPage],
    queryFn: () => shopCategoriesApi.getAll({ page: currentPage, limit: perPage }),
  });

  const categories = categoriesData?.data || [];
  const totalPages = categoriesData?.meta?.totalPages || 1;

  const { data: categoryDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["shop-categories", viewCategory?.id],
    queryFn: () => shopCategoriesApi.getById(viewCategory!.id),
    enabled: !!viewCategory,
  });

  const { data: partnersData } = useQuery({
    queryKey: ["partners-all"],
    queryFn: () => partnersApi.getAll({ limit: 100 }),
    enabled: !!viewCategory,
  });
  const allPartners = partnersData?.data || [];

  const linkedPartnerIds = categoryDetail?.partners?.map((p) => p.id) ?? [];
  const availablePartners = allPartners.filter((p) => !linkedPartnerIds.includes(p.id));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["shop-categories"] });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateShopCategoryRequest; file?: File }) =>
      shopCategoriesApi.create(data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Category created successfully!");
      setIsCreateOpen(false);
      setFormData(defaultForm);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateShopCategoryRequest>; file?: File }) =>
      shopCategoriesApi.update(id, data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Category updated successfully!");
      setEditCategory(null);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to update category"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      shopCategoriesApi.update(id, { is_active }),
    onSuccess: () => {
      invalidate();
      toast.success("Category status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: shopCategoriesApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Category deleted successfully!");
    },
    onError: () => toast.error("Failed to delete category"),
  });

  const linkPartnerMutation = useMutation({
    mutationFn: ({ partnerId, categoryId }: { partnerId: number; categoryId: number }) =>
      shopCategoriesApi.linkPartner({ partner_id: partnerId, category_id: categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-categories", viewCategory?.id] });
      setSelectedPartnerId("");
      toast.success("Partner linked!");
    },
    onError: () => toast.error("Failed to link partner"),
  });

  const unlinkPartnerMutation = useMutation({
    mutationFn: ({ partnerId, categoryId }: { partnerId: number; categoryId: number }) =>
      shopCategoriesApi.unlinkPartner(partnerId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-categories", viewCategory?.id] });
      toast.success("Partner unlinked!");
    },
    onError: () => toast.error("Failed to unlink partner"),
  });

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createMutation.mutate({ data: formData, file: selectedFile || undefined });
  }

  function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editCategory) return;
    updateMutation.mutate({ id: editCategory.id, data: formData, file: selectedFile || undefined });
  }

  function openEdit(category: ShopCategory) {
    setEditCategory(category);
    setFormData({
      name: category.name,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setSelectedFile(null);
  }

  const formFields = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Coffee, Juice"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={formData.sort_order ?? 0}
            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <Switch
            checked={formData.is_active ?? true}
            onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
          />
          <Label>Active</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Image</Label>
        {(selectedFile || editCategory?.image_url) && (() => {
          const src = selectedFile ? URL.createObjectURL(selectedFile) : editCategory?.image_url || "";
          return (
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setPreviewImage(src)}
                className="block overflow-hidden rounded-lg border hover:opacity-80 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Preview" className="max-h-24 w-auto object-contain" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })()}
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
          }}
        />
        {editCategory && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shop Categories</h1>
          <p className="text-muted-foreground">Manage shop categories and linked partners</p>
        </div>
        <Button onClick={() => { setFormData(defaultForm); setSelectedFile(null); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[160px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="text-muted-foreground">#{category.id}</TableCell>
                  <TableCell>
                    {category.image_url ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded">
                        <Image src={category.image_url} alt={category.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={(v) => toggleActiveMutation.mutate({ id: category.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer text-xs"
                        onClick={() => { setViewCategory(category); setSelectedPartnerId(""); }}
                      >
                        Partners
                      </Button>
                      <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => openEdit(category)}>
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

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        perPage={perPage}
        onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
        isLoading={isLoading}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new shop category</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            {formFields}
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
      <Dialog open={!!editCategory} onOpenChange={(open) => {
        if (!open) { setEditCategory(null); setSelectedFile(null); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category settings</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditCategory(null); setSelectedFile(null); }}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Partner Link/Unlink Dialog */}
      <Dialog open={!!viewCategory} onOpenChange={(open) => { if (!open) setViewCategory(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewCategory?.name} — Partners</DialogTitle>
            <DialogDescription>Manage partners linked to this category</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="max-h-60 overflow-y-auto">
              {isDetailLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : !categoryDetail?.partners || categoryDetail.partners.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No partners linked to this category</p>
              ) : (
                <div className="space-y-2">
                  {categoryDetail.partners.map((partner) => (
                    <div key={partner.id} className="flex items-center gap-3 rounded-lg border p-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted flex-shrink-0">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{partner.name}</p>
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => unlinkPartnerMutation.mutate({ partnerId: partner.id, categoryId: viewCategory!.id })}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Link a partner</p>
              <div className="flex gap-2">
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select partner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePartners.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={!selectedPartnerId || linkPartnerMutation.isPending}
                  onClick={() => {
                    if (!viewCategory || !selectedPartnerId) return;
                    linkPartnerMutation.mutate({ partnerId: Number(selectedPartnerId), categoryId: viewCategory.id });
                  }}
                >
                  Link
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCategory(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Category image preview</DialogDescription>
          </DialogHeader>
          {previewImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewImage} alt="Category preview" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ShopCategoriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading shop categories...</div>}>
      <ShopCategoriesContent />
    </Suspense>
  );
}
