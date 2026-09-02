import { Suspense, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTableSort } from "@/hooks/use-table-sort";
import { categoriesApi } from "@/lib/api/domains/categories";
import type { Category, CategoryLanguage, SaveCategoryRequest } from "@/lib/api/schemas/categories";
import { CategoryFormDialog } from "./components/category-form-dialog";

function translationName(category: Category, language: CategoryLanguage) {
  return category.translations.find((translation) => translation.language === language)?.name;
}

function CategoriesContent() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() => setCurrentPage(1));
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category>();
  const [deletingCategory, setDeletingCategory] = useState<Category>();

  const categoriesQuery = useQuery({
    queryKey: ["categories", currentPage, search, perPage, sortParam, orderParam],
    queryFn: () => categoriesApi.getAll({
      page: currentPage,
      limit: perPage,
      search: search || undefined,
      sort: sortParam,
      order: orderParam,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: SaveCategoryRequest) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCreateOpen(false);
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SaveCategoryRequest }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(undefined);
      toast.success("Category updated");
    },
    onError: () => toast.error("Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeletingCategory(undefined);
      toast.success("Category deleted");
    },
    onError: () => toast.error("Failed to delete category"),
  });

  const categories = categoriesQuery.data?.data ?? [];
  const totalPages = categoriesQuery.data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage global partner categories and their customer-facing translations."
        action={
          <Button onClick={() => setCreateOpen(true)}>
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
            onChange={(event) => {
              setSearch(event.target.value || null);
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
              <SortableTableHead className="w-[72px]" column="id" sort={sort} order={order} onSort={onSort}>
                ID
              </SortableTableHead>
              <SortableTableHead column="name" sort={sort} order={order} onSort={onSort}>
                Russian
              </SortableTableHead>
              <TableHead>Uzbek</TableHead>
              <TableHead>English</TableHead>
              <SortableTableHead column="updated_at" sort={sort} order={order} onSort={onSort}>
                Updated
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriesQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : categoriesQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-destructive">
                  Failed to load categories
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    title="No categories found"
                    description={search ? "Try a different search term." : "Create the first global category."}
                    action={!search ? (
                      <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4" />
                        Add category
                      </Button>
                    ) : null}
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
                    <p className="text-sm font-medium">{translationName(category, "ru") ?? category.name}</p>
                    {category.description ? (
                      <p className="line-clamp-1 max-w-[280px] text-xs text-muted-foreground">{category.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">
                    {translationName(category, "uz") ?? <span className="text-muted-foreground">Not added</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {translationName(category, "en") ?? <span className="text-muted-foreground">Not added</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(category.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditingCategory(category)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingCategory(category)}
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
          onPerPageChange={(value) => {
            setPerPage(value);
            setCurrentPage(1);
          }}
          isLoading={categoriesQuery.isLoading}
        />
      </DataTableShell>

      <CategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        pending={createMutation.isPending}
        onSubmit={(data) => createMutation.mutate(data)}
      />

      <CategoryFormDialog
        open={Boolean(editingCategory)}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(undefined);
        }}
        category={editingCategory}
        pending={updateMutation.isPending}
        onSubmit={(data) => {
          if (editingCategory) updateMutation.mutate({ id: editingCategory.id, data });
        }}
      />

      <Dialog open={Boolean(deletingCategory)} onOpenChange={(open) => {
        if (!open) setDeletingCategory(undefined);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              This permanently deletes “{deletingCategory?.name}”, all translations, and every partner link to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(undefined)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading categories…</div>}>
      <CategoriesContent />
    </Suspense>
  );
}
