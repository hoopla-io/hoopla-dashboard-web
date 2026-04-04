"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LayoutPanelTop } from "lucide-react";
import Image from "next/image";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { bannersApi } from "@/lib/api/domains/banners";
import { partnersApi } from "@/lib/api/domains/partners";
import { drinksApi } from "@/lib/api/domains/drinks";
import type { Banner, CreateBannerRequest } from "@/lib/api/schemas/banners";

const LINK_TYPE_LABELS: Record<string, string> = { partner: "Partner", drink: "Drink", url: "URL" };
const POSITION_LABELS: Record<string, string> = { main: "Main", partner: "Partner" };

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function formatDateForApi(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const defaultForm: CreateBannerRequest = {
  title: "",
  link_type: "url",
  link_value: "",
  position: "main",
  sort_order: 0,
  is_active: true,
  start_date: "",
  end_date: "",
};

function BannersContent() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [positionFilter, setPositionFilter] = useQueryState("position", parseAsString.withDefault(""));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<CreateBannerRequest>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: bannersData, isLoading } = useQuery({
    queryKey: ["banners", currentPage, perPage, positionFilter],
    queryFn: () => bannersApi.getAll({
      page: currentPage,
      limit: perPage,
      position: positionFilter || undefined,
    }),
  });

  const banners = bannersData?.data || [];
  const totalPages = bannersData?.meta?.totalPages || 1;

  const { data: partnersData } = useQuery({
    queryKey: ["partners-all"],
    queryFn: () => partnersApi.getAll({ limit: 100 }),
  });
  const partners = partnersData?.data || [];

  const { data: drinksData } = useQuery({
    queryKey: ["drinks-all"],
    queryFn: () => drinksApi.getAll({ limit: 100 }),
  });
  const drinks = drinksData?.data || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["banners"] });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateBannerRequest; file?: File }) => bannersApi.create(data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Banner created successfully!");
      setIsCreateOpen(false);
      setFormData(defaultForm);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to create banner"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateBannerRequest>; file?: File }) =>
      bannersApi.update(id, data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Banner updated successfully!");
      setEditBanner(null);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to update banner"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      bannersApi.update(id, { is_active }),
    onSuccess: () => {
      invalidate();
      toast.success("Banner status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: bannersApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Banner deleted successfully!");
    },
    onError: () => toast.error("Failed to delete banner"),
  });

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.start_date) payload.start_date = formatDateForApi(payload.start_date);
    if (payload.end_date) payload.end_date = formatDateForApi(payload.end_date);
    createMutation.mutate({ data: payload, file: selectedFile || undefined });
  }

  function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBanner) return;
    const payload = { ...formData };
    if (payload.start_date) payload.start_date = formatDateForApi(payload.start_date);
    if (payload.end_date) payload.end_date = formatDateForApi(payload.end_date);
    updateMutation.mutate({ id: editBanner.id, data: payload, file: selectedFile || undefined });
  }

  function openEdit(banner: Banner) {
    setEditBanner(banner);
    setFormData({
      title: banner.title || "",
      link_type: banner.link_type,
      link_value: banner.link_value || "",
      position: banner.position,
      partner_id: banner.partner_id ?? undefined,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
      start_date: formatDateForInput(banner.start_date),
      end_date: formatDateForInput(banner.end_date),
    });
    setSelectedFile(null);
  }

  const formFields = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title (Optional)</Label>
        <Input
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Banner title"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Position</Label>
          <Select
            value={formData.position}
            onValueChange={(v) => setFormData({ ...formData, position: v as "main" | "partner", partner_id: undefined })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main (Home)</SelectItem>
              <SelectItem value="partner">Partner Page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.position === "partner" && (
          <div className="space-y-2">
            <Label>Partner</Label>
            <Select
              value={formData.partner_id ? String(formData.partner_id) : ""}
              onValueChange={(v) => setFormData({ ...formData, partner_id: Number(v) })}
            >
              <SelectTrigger><SelectValue placeholder="Select partner..." /></SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Link Type</Label>
        <Select
          value={formData.link_type}
          onValueChange={(v) => setFormData({ ...formData, link_type: v as "partner" | "drink" | "url", link_value: "" })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="drink">Drink</SelectItem>
            <SelectItem value="url">URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Link Value</Label>
        {formData.link_type === "partner" ? (
          <Select
            value={formData.link_value || ""}
            onValueChange={(v) => setFormData({ ...formData, link_value: v })}
          >
            <SelectTrigger><SelectValue placeholder="Select partner..." /></SelectTrigger>
            <SelectContent>
              {partners.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : formData.link_type === "drink" ? (
          <Select
            value={formData.link_value || ""}
            onValueChange={(v) => setFormData({ ...formData, link_value: v })}
          >
            <SelectTrigger><SelectValue placeholder="Select drink..." /></SelectTrigger>
            <SelectContent>
              {drinks.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={formData.link_value || ""}
            onChange={(e) => setFormData({ ...formData, link_value: e.target.value })}
            placeholder="https://..."
          />
        )}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date (Optional)</Label>
          <Input
            type="datetime-local"
            value={formData.start_date || ""}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date (Optional)</Label>
          <Input
            type="datetime-local"
            value={formData.end_date || ""}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Image</Label>
        <div className="flex items-center gap-4">
          {editBanner && (
            <div className="relative h-16 w-24 overflow-hidden rounded-lg border">
              {selectedFile ? (
                <Image src={URL.createObjectURL(selectedFile)} alt="Preview" fill className="object-cover" />
              ) : editBanner.image_url ? (
                <Image src={editBanner.image_url} alt={editBanner.title || "Banner"} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <LayoutPanelTop className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
              }}
            />
            {editBanner && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-muted-foreground">Manage promotional banners</p>
        </div>
        <Button onClick={() => { setFormData(defaultForm); setSelectedFile(null); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={positionFilter || "all"}
          onValueChange={(v) => {
            setPositionFilter(v === "all" ? null : v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by position" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="main">Main</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No banners found
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="text-muted-foreground">#{banner.id}</TableCell>
                  <TableCell>
                    {banner.image_url ? (
                      <div className="relative h-10 w-20 overflow-hidden rounded">
                        <Image src={banner.image_url} alt={banner.title || "Banner"} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-20 items-center justify-center rounded bg-muted">
                        <LayoutPanelTop className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{banner.title || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{LINK_TYPE_LABELS[banner.link_type]}</Badge>
                    {banner.link_value && (
                      <span className="ml-2 text-xs text-muted-foreground">{banner.link_value}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{POSITION_LABELS[banner.position]}</Badge>
                  </TableCell>
                  <TableCell>{banner.sort_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(v) => toggleActiveMutation.mutate({ id: banner.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : "—"}
                    {" → "}
                    {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => openEdit(banner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive cursor-pointer"
                        onClick={() => deleteMutation.mutate(banner.id)}
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
            <DialogTitle>Create Banner</DialogTitle>
            <DialogDescription>Add a new promotional banner</DialogDescription>
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
      <Dialog open={!!editBanner} onOpenChange={(open) => {
        if (!open) { setEditBanner(null); setSelectedFile(null); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
            <DialogDescription>Update banner settings</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditBanner(null); setSelectedFile(null); }}>Cancel</Button>
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

export default function BannersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading banners...</div>}>
      <BannersContent />
    </Suspense>
  );
}
