
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Search, Pencil, Sparkles } from "lucide-react";
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
import { ErrorBoundary } from "@/components/error-boundary";
import { useTableSort } from "@/hooks/use-table-sort";
import { partnersApi } from "@/lib/api/domains/partners";
import type { CreatePartnerRequest } from "@/lib/api/schemas/partners";

function PartnersContent() {
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

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      queueMicrotask(() => setIsCreateOpen(true));
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      navigate(`/partners?${params.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const [formData, setFormData] = useState<CreatePartnerRequest>({ name: "", description: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: partnersData, isLoading } = useQuery({
    queryKey: ["partners", currentPage, perPage, search, sortParam, orderParam],
    queryFn: () =>
      partnersApi.getAll({
        page: currentPage,
        limit: perPage,
        search: search || undefined,
        sort: sortParam,
        order: orderParam,
      }),
  });

  const partners = partnersData?.data || [];
  const meta = partnersData?.meta;
  const totalPages = meta?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreatePartnerRequest; file?: File }) =>
      partnersApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner created");
      setIsCreateOpen(false);
      setFormData({ name: "", description: "" });
      setSelectedFile(undefined);
    },
    onError: () => toast.error("Failed to create partner"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: number;
      data: Partial<CreatePartnerRequest>;
      file?: File;
    }) => partnersApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner updated");
      setSelectedFile(undefined);
      setIsCreateOpen(false);
      setEditingId(null);
      setFormData({ name: "", description: "" });
    },
    onError: () => toast.error("Failed to update partner"),
  });

  const deleteMutation = useMutation({
    mutationFn: partnersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner deleted");
    },
    onError: () => toast.error("Failed to delete partner"),
  });

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData, file: selectedFile });
    } else {
      createMutation.mutate({ data: formData, file: selectedFile });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partners"
        description="Manage partner organizations and their cashback settings."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/partners/onboarding")}>
              <Sparkles className="size-4" />
              Onboard new partner
            </Button>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", description: "" });
                setSelectedFile(undefined);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add partner
            </Button>
          </div>
        }
      />

      <PageToolbar>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search partners"
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
              <TableHead className="w-[64px]">Logo</TableHead>
              <SortableTableHead column="name" sort={sort} order={order} onSort={onSort}>
                Name
              </SortableTableHead>
              <SortableTableHead column="vendor" sort={sort} order={order} onSort={onSort}>
                Vendor
              </SortableTableHead>
              <SortableTableHead column="tin_num" sort={sort} order={order} onSort={onSort}>
                TIN
              </SortableTableHead>
              <SortableTableHead column="cashback_percent" sort={sort} order={order} onSort={onSort}>
                Cashback
              </SortableTableHead>
              <SortableTableHead column="rating" sort={sort} order={order} onSort={onSort}>
                Rating
              </SortableTableHead>
              <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                Created
              </SortableTableHead>
              <SortableTableHead column="status" sort={sort} order={order} onSort={onSort}>
                Status
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <EmptyState
                    title="No partners found"
                    description={
                      search
                        ? "Try a different search term."
                        : "Add your first partner to get started."
                    }
                    action={
                      !search ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setFormData({ name: "", description: "" });
                            setSelectedFile(undefined);
                            setIsCreateOpen(true);
                          }}
                        >
                          <Plus className="size-4" />
                          Add partner
                        </Button>
                      ) : null
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow
                  key={partner.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/partners/${partner.id}`)}
                >
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{partner.id}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {partner.image_url ? (
                      <button
                        type="button"
                        className="size-8 overflow-hidden rounded-full ring-1 ring-border transition-opacity hover:opacity-80"
                        onClick={() => setPreviewImage(partner.image_url!)}
                      >
                        <img
                          src={partner.image_url}
                          alt={partner.name}
                          className="size-8 rounded-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {partner.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {partner.vendor || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="text-muted-foreground">{partner.tin_type || "—"}</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {partner.tin_num || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {partner.cashback_percent ? `${partner.cashback_percent}%` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {partner.rating != null ? partner.rating.toFixed(1) : "5.0"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {partner.created_at
                      ? new Date(partner.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={partner.status !== false}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: partner.id, data: { status: checked } })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingId(partner.id);
                          setFormData({
                            name: partner.name,
                            description: partner.description || "",
                          });
                          setIsCreateOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(partner.id)}
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
          onPageChange={(p) => setCurrentPage(p)}
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </DataTableShell>

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Image preview</DialogTitle>
            <DialogDescription>Partner logo preview</DialogDescription>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Partner preview"
              className="h-auto w-full rounded"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit partner" : "Create partner"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update partner details." : "Add a new partner organization."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Partner name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Short description"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file">Logo (JPG/PNG)</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId
                  ? updateMutation.isPending
                    ? "Saving…"
                    : "Save changes"
                  : createMutation.isPending
                    ? "Creating…"
                    : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <ErrorBoundary pageName="Partners">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading partners…
          </div>
        }
      >
        <PartnersContent />
      </Suspense>
    </ErrorBoundary>
  );
}
