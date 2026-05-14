
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, ChevronsUpDown, X, CalendarIcon } from "lucide-react";
import Image from "@/components/ui/image";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

import { cn } from "@/lib/utils";
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
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { bannersApi } from "@/lib/api/domains/banners";
import { partnersApi } from "@/lib/api/domains/partners";
import { drinksApi } from "@/lib/api/domains/drinks";
import type { Banner, CreateBannerRequest } from "@/lib/api/schemas/banners";

const LINK_TYPE_LABELS: Record<string, string> = { partner: "Partner", drink: "Drink", url: "URL" };
const POSITION_LABELS: Record<string, string> = { main: "Main", partner: "Partner" };

function dateToIso(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

function isoToApi(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getTimeFromIso(iso: string): string {
  if (!iso) return "00:00";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "00:00";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setTimeOnIso(iso: string, time: string): string {
  const d = iso ? new Date(iso) : new Date();
  const [hh, mm] = time.split(":").map(Number);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.toISOString();
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

function DateTimePicker({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (iso: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;
  const hasValue = !!value && !isNaN(new Date(value).getTime());

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !hasValue && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {hasValue ? format(date!, "dd/MM/yyyy") : "Pick a date"}
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                className="ml-auto"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClear(); } }}
              >
                <X className="h-4 w-4 opacity-50 hover:opacity-100" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                const prev = value ? new Date(value) : new Date();
                d.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                onChange(d.toISOString());
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {hasValue && (
        <Input
          type="time"
          value={getTimeFromIso(value)}
          onChange={(e) => onChange(setTimeOnIso(value, e.target.value))}
        />
      )}
    </div>
  );
}

function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  items,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  items: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {selected ? selected.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function BannersContent() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [positionFilter, setPositionFilter] = useQueryState("position", parseAsString.withDefault(""));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<CreateBannerRequest>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    if (payload.start_date) payload.start_date = isoToApi(payload.start_date);
    if (payload.end_date) payload.end_date = isoToApi(payload.end_date);
    createMutation.mutate({ data: payload, file: selectedFile || undefined });
  }

  function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBanner) return;
    const payload = { ...formData };
    if (payload.start_date) payload.start_date = isoToApi(payload.start_date);
    if (payload.end_date) payload.end_date = isoToApi(payload.end_date);
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
      start_date: dateToIso(banner.start_date),
      end_date: dateToIso(banner.end_date),
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

      <div className="space-y-2">
        <Label>Position</Label>
        <Select
          value={formData.position}
          onValueChange={(v) => setFormData({ ...formData, position: v as "main" | "partner", partner_id: undefined })}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
            <SelectTrigger className="w-full"><SelectValue placeholder="Select partner..." /></SelectTrigger>
            <SelectContent>
              {partners.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Link Type</Label>
        <Select
          value={formData.link_type}
          onValueChange={(v) => setFormData({ ...formData, link_type: v as "partner" | "drink" | "url", link_value: "" })}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
          <SearchableSelect
            value={formData.link_value || ""}
            onValueChange={(v) => setFormData({ ...formData, link_value: v })}
            placeholder="Select partner..."
            searchPlaceholder="Search partners..."
            items={partners.map((p) => ({ value: String(p.id), label: p.name }))}
          />
        ) : formData.link_type === "drink" ? (
          <SearchableSelect
            value={formData.link_value || ""}
            onValueChange={(v) => setFormData({ ...formData, link_value: v })}
            placeholder="Select drink..."
            searchPlaceholder="Search drinks..."
            items={drinks.map((d) => ({ value: String(d.id), label: d.name }))}
          />
        ) : (
          <Input
            value={formData.link_value || ""}
            onChange={(e) => setFormData({ ...formData, link_value: e.target.value })}
            placeholder="https://..."
          />
        )}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Start Date (Optional)</Label>
          <DateTimePicker
            value={formData.start_date || ""}
            onChange={(v) => setFormData({ ...formData, start_date: v })}
            onClear={() => setFormData({ ...formData, start_date: "" })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date (Optional)</Label>
          <DateTimePicker
            value={formData.end_date || ""}
            onChange={(v) => setFormData({ ...formData, end_date: v })}
            onClear={() => setFormData({ ...formData, end_date: "" })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Image</Label>
        {(selectedFile || editBanner?.image_url) && (() => {
          const src = selectedFile ? URL.createObjectURL(selectedFile) : editBanner?.image_url || "";
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
        {editBanner && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        description="Manage promotional banners on the home and partner pages."
        action={
          <Button
            onClick={() => {
              setFormData(defaultForm);
              setSelectedFile(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add banner
          </Button>
        }
      />

      <PageToolbar>
        <Select
          value={positionFilter || "all"}
          onValueChange={(v) => {
            setPositionFilter(v === "all" ? null : v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All positions</SelectItem>
            <SelectItem value="main">Main</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
          </SelectContent>
        </Select>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]">ID</TableHead>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    title="No banners yet"
                    description="Promotional banners shown in the app will appear here."
                    action={
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
                        Add banner
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{banner.id}
                  </TableCell>
                  <TableCell>
                    {banner.image_url ? (
                      <button
                        type="button"
                        className="relative h-9 w-16 overflow-hidden rounded-md ring-1 ring-border transition-opacity hover:opacity-80"
                        onClick={() => setPreviewImage(banner.image_url!)}
                      >
                        <Image src={banner.image_url} alt={banner.title || "Banner"} fill className="object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-9 w-16 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {banner.title || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-foreground">
                        {LINK_TYPE_LABELS[banner.link_type]}
                      </span>
                      {banner.link_value && (
                        <span className="max-w-[180px] truncate font-mono text-[11px] text-muted-foreground">
                          {banner.link_value}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {POSITION_LABELS[banner.position]}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {banner.sort_order}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(v) => toggleActiveMutation.mutate({ id: banner.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {banner.start_date ? new Date(banner.start_date).toLocaleDateString("ru-RU") : "—"}
                    </span>
                    <span className="px-1">→</span>
                    <span className="font-mono tabular-nums">
                      {banner.end_date ? new Date(banner.end_date).toLocaleDateString("ru-RU") : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(banner)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(banner.id)}
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

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Banner image preview</DialogDescription>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Banner preview" className="w-full h-auto rounded" />
          )}
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
