
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MapPin, MoreVertical } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTableSort } from "@/hooks/use-table-sort";
import { ShopForm } from "@/components/forms/shop-form";
import { shopsApi } from "@/lib/api/domains/shops";
import { partnersApi } from "@/lib/api/domains/partners";
import type { Shop, CreateShopRequest } from "@/lib/api/schemas/shops";

function ShopsContent() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() =>
    setCurrentPage(1)
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setTimeout(() => setIsCreateOpen(true), 0);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      navigate(`/shops?${params.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const { data: shopsData, isLoading } = useQuery({
    queryKey: ["shops", currentPage, perPage, search, sortParam, orderParam],
    queryFn: () =>
      shopsApi.getAll({
        page: currentPage,
        limit: perPage,
        search: search || undefined,
        sort: sortParam,
        order: orderParam,
      }),
  });

  const shops = shopsData?.data || [];
  const meta = shopsData?.meta;
  const totalPages = meta?.totalPages || 1;

  const { data: partnersData } = useQuery({
    queryKey: ["partners-list"],
    queryFn: () => partnersApi.getAll({ page: 1, limit: 100 }),
  });
  const partners = partnersData?.data || [];

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateShopRequest; file?: File }) =>
      shopsApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Shop created");
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Failed to create shop"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: number;
      data: Partial<CreateShopRequest>;
      file?: File;
    }) => shopsApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Shop updated");
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Failed to update shop"),
  });

  const deleteMutation = useMutation({
    mutationFn: shopsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Shop deleted");
    },
    onError: () => toast.error("Failed to delete shop"),
  });

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    setIsCreateOpen(true);
  };

  const handleCreateOpen = () => {
    setEditingShop(null);
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shops"
        description="Manage shop locations and POS bindings."
        action={
          <Button onClick={handleCreateOpen}>
            <Plus className="size-4" />
            Add shop
          </Button>
        }
      />

      <PageToolbar>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shops"
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
              <TableHead>Partner</TableHead>
              <TableHead>Location</TableHead>
              <SortableTableHead column="status" sort={sort} order={order} onSort={onSort}>
                Status
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : shops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="No shops found"
                    description={
                      search
                        ? "Try a different search term."
                        : "Add your first shop to get started."
                    }
                    action={
                      !search ? (
                        <Button variant="outline" size="sm" onClick={handleCreateOpen}>
                          <Plus className="size-4" />
                          Add shop
                        </Button>
                      ) : null
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              shops.map((shop) => (
                <TableRow
                  key={shop.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/shops/${shop.id}`)}
                >
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{shop.id}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {shop.image_url ? (
                      <button
                        type="button"
                        className="overflow-hidden rounded-md ring-1 ring-border transition-opacity hover:opacity-80"
                        onClick={() => setSelectedImage(shop.image_url || undefined)}
                      >
                        <img
                          src={shop.image_url}
                          alt={shop.name}
                          width={36}
                          height={36}
                          className="size-9 object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{shop.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {shop.partner?.name || "—"}
                  </TableCell>
                  <TableCell>
                    {shop.location_lat && shop.location_long ? (
                      <a
                        href={`https://yandex.com/maps/?text=${shop.location_lat},${shop.location_long}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-foreground underline-offset-4 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin className="size-3 text-muted-foreground" />
                        {shop.location_lat.toFixed(4)}, {shop.location_long.toFixed(4)}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={shop.status !== false}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: shop.id, data: { status: checked } })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(shop)}>
                        <Pencil className="size-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteMutation.mutate(shop.id)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          onPageChange={(p) => setCurrentPage(p)}
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </DataTableShell>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShop ? "Edit shop" : "Create shop"}</DialogTitle>
            <DialogDescription>
              {editingShop ? "Update shop details." : "Add a new shop location."}
            </DialogDescription>
          </DialogHeader>
          <ShopForm
            key={editingShop?.id ?? "create"}
            partnerOptions={partners}
            initialValues={
              editingShop
                ? {
                    partner_id: editingShop.partner?.id || editingShop.partnerId || 0,
                    name: editingShop.name,
                    vendor_terminal_id: editingShop.vendor_terminal_id || "",
                    vendor_login: editingShop.vendor_login || "",
                    vendor_organization_id: editingShop.vendor_organization_id || "",
                    location_lat: editingShop.location?.lat ?? editingShop.location_lat ?? 0,
                    location_long: editingShop.location?.lng ?? editingShop.location_long ?? 0,
                    use_own_legal: editingShop.use_own_legal ?? false,
                    tin_type: editingShop.tin_type ?? "",
                    tin_num: editingShop.tin_num ?? "",
                    tin_percent: editingShop.tin_percent ?? 0,
                    always_open: editingShop.always_open ?? false,
                    restock_time: editingShop.restock_time ?? "",
                  }
                : undefined
            }
            isEditing={!!editingShop}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onSubmit={(data, file) => {
              if (editingShop) {
                updateMutation.mutate({ id: editingShop.id, data, file });
              } else {
                createMutation.mutate({ data, file });
              }
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(undefined)}>
        <DialogContent className="max-w-3xl border-none bg-transparent shadow-none">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {selectedImage && (
            <div className="relative flex h-[80vh] w-full items-center justify-center">
              <img
                src={selectedImage}
                alt="Shop preview"
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ShopsPage() {
  return (
    <ErrorBoundary pageName="Shops">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading shops…
          </div>
        }
      >
        <ShopsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
