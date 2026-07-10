
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import Image from "@/components/ui/image";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

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
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { SearchableSelect } from "@/components/pickers/searchable-select";
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
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(20));
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() =>
    setCurrentPage(1)
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ShopCategory | null>(null);
  const [formData, setFormData] = useState<CreateShopCategoryRequest>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [viewCategory, setViewCategory] = useState<ShopCategory | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  // shopCategoriesApi has no server-side search param — when searching, fetch a
  // much larger page so the client-side filter isn't limited to whatever page
  // happened to be loaded, then re-paginate the filtered set client-side too.
  const isSearching = search.trim().length > 0;
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["shop-categories", currentPage, perPage, sortParam, orderParam, isSearching],
    queryFn: () =>
      shopCategoriesApi.getAll({
        page: isSearching ? 1 : currentPage,
        limit: isSearching ? 1000 : perPage,
        sort: sortParam,
        order: orderParam,
      }),
  });

  const allCategories = categoriesData?.data || [];
  const filteredCategories = isSearching
    ? allCategories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allCategories;
  const categories = isSearching
    ? filteredCategories.slice((currentPage - 1) * perPage, currentPage * perPage)
    : filteredCategories;
  const totalPages = isSearching
    ? Math.max(1, Math.ceil(filteredCategories.length / perPage))
    : categoriesData?.meta?.totalPages || 1;

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <PageHeader
        title="Shop Categories"
        description="Group shops into categories shown in the mobile app."
        action={
          <Button
            onClick={() => {
              setFormData(defaultForm);
              setSelectedFile(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add category
          </Button>
        }
      />

      <PageToolbar>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories"
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
              <TableHead className="w-[64px]">Image</TableHead>
              <SortableTableHead column="name" sort={sort} order={order} onSort={onSort}>
                Name
              </SortableTableHead>
              <SortableTableHead column="sort_order" sort={sort} order={order} onSort={onSort}>
                Order
              </SortableTableHead>
              <SortableTableHead column="is_active" sort={sort} order={order} onSort={onSort}>
                Active
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    title="No categories found"
                    description={
                      search
                        ? "Try a different search term."
                        : "Create your first category to group shops in the app."
                    }
                    action={
                      !search ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData(defaultForm);
                            setSelectedFile(null);
                            setIsCreateOpen(true);
                          }}
                        >
                          <Plus className="size-4" />
                          Add category
                        </Button>
                      ) : null
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{category.id}
                  </TableCell>
                  <TableCell>
                    {category.image_url ? (
                      <button
                        type="button"
                        className="relative size-9 overflow-hidden rounded-md ring-1 ring-border transition-opacity hover:opacity-80"
                        onClick={() => setPreviewImage(category.image_url!)}
                      >
                        <Image src={category.image_url} alt={category.name} fill className="object-cover" />
                      </button>
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{category.name}</TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {category.sort_order}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={(v) => toggleActiveMutation.mutate({ id: category.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setViewCategory(category);
                          setSelectedPartnerId("");
                        }}
                      >
                        Partners
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(category)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(category.id)}
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
                <div className="space-y-1.5">
                  {categoryDetail.partners.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                    >
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        #{partner.id}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{partner.name}</p>
                      <button
                        type="button"
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        onClick={() =>
                          unlinkPartnerMutation.mutate({
                            partnerId: partner.id,
                            categoryId: viewCategory!.id,
                          })
                        }
                        aria-label="Unlink partner"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Link a partner</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={selectedPartnerId}
                    onValueChange={setSelectedPartnerId}
                    placeholder="Select partner..."
                    searchPlaceholder="Search partners…"
                    items={availablePartners.map((p) => ({ value: String(p.id), label: p.name }))}
                  />
                </div>
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
