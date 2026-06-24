import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarIcon, X, Check, ChevronsUpDown } from "lucide-react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { format } from "date-fns";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { promocodesApi } from "@/lib/api/domains/promocodes";
import { partnersApi } from "@/lib/api/domains/partners";
import { usersApi } from "@/lib/api/domains/users";
import type { Promocode, CreatePromocodeRequest } from "@/lib/api/schemas/promocodes";

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

// "" -> undefined, else Number; keeps optional numeric fields clean.
function numOrUndef(v: string): number | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

const defaultForm: CreatePromocodeRequest = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  min_order_amount: 0,
  per_user_limit: 1,
  is_active: true,
  starts_at: "",
  expires_at: "",
};

function DateTimePicker({
  value, onChange, onClear,
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

// Reserve a promocode for a single account: search users by phone.
function AccountPicker({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (id: number | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["promocode-users-search", search],
    queryFn: () => usersApi.getAll({ phone_number: search || undefined, limit: 10 }),
    enabled: open,
  });
  const users = data?.data || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {value ? `Account #${value}` : "Anyone"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by phone…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="anyone" onSelect={() => { onChange(undefined); setOpen(false); }}>
                <Check className={cn("mr-2 h-4 w-4", value === undefined ? "opacity-100" : "opacity-0")} />
                Anyone
              </CommandItem>
              {users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={String(u.id)}
                  onSelect={() => { onChange(u.id); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === u.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex flex-col">
                    <span className="text-sm">{u.phone_number || `#${u.id}`}</span>
                    {u.name && <span className="text-xs text-muted-foreground">{u.name}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PromocodesContent() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [codeFilter, setCodeFilter] = useQueryState("code", parseAsString.withDefault(""));
  const [activeFilter, setActiveFilter] = useQueryState("active", parseAsString.withDefault(""));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editPromocode, setEditPromocode] = useState<Promocode | null>(null);
  const [formData, setFormData] = useState<CreatePromocodeRequest>(defaultForm);

  const { data: promocodesData, isLoading } = useQuery({
    queryKey: ["promocodes", currentPage, perPage, codeFilter, activeFilter],
    queryFn: () => promocodesApi.getAll({
      page: currentPage,
      limit: perPage,
      code: codeFilter || undefined,
      is_active: activeFilter === "" ? undefined : activeFilter === "true",
    }),
  });

  const promocodes = promocodesData?.data || [];
  const totalPages = promocodesData?.meta?.totalPages || 1;

  const { data: partnersData } = useQuery({
    queryKey: ["partners-all"],
    queryFn: () => partnersApi.getAll({ limit: 100 }),
  });
  const partners = partnersData?.data || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["promocodes"] });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromocodeRequest) => promocodesApi.create(data),
    onSuccess: () => {
      invalidate();
      toast.success("Promocode created successfully!");
      setIsCreateOpen(false);
      setFormData(defaultForm);
    },
    onError: (err: unknown) => toast.error(extractError(err, "Failed to create promocode")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePromocodeRequest> }) =>
      promocodesApi.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Promocode updated successfully!");
      setEditPromocode(null);
    },
    onError: (err: unknown) => toast.error(extractError(err, "Failed to update promocode")),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      promocodesApi.update(id, { is_active }),
    onSuccess: () => {
      invalidate();
      toast.success("Promocode status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: promocodesApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Promocode deleted successfully!");
    },
    onError: () => toast.error("Failed to delete promocode"),
  });

  function buildPayload(): CreatePromocodeRequest {
    const payload = { ...formData };
    payload.code = payload.code.trim();
    if (payload.starts_at) payload.starts_at = isoToApi(payload.starts_at);
    if (payload.expires_at) payload.expires_at = isoToApi(payload.expires_at);
    if (!payload.description) delete payload.description;
    return payload;
  }

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(buildPayload());
  }

  function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPromocode) return;
    updateMutation.mutate({ id: editPromocode.id, data: buildPayload() });
  }

  function openEdit(promocode: Promocode) {
    setEditPromocode(promocode);
    setFormData({
      code: promocode.code,
      description: promocode.description || "",
      discount_type: promocode.discount_type,
      discount_value: promocode.discount_value,
      max_discount_percent: promocode.max_discount_percent ?? undefined,
      max_discount_amount: promocode.max_discount_amount ?? undefined,
      min_order_amount: promocode.min_order_amount,
      usage_limit: promocode.usage_limit ?? undefined,
      per_user_limit: promocode.per_user_limit,
      partner_id: promocode.partner_id ?? undefined,
      user_id: promocode.user_id ?? undefined,
      is_active: promocode.is_active,
      starts_at: dateToIso(promocode.starts_at),
      expires_at: dateToIso(promocode.expires_at),
    });
  }

  const isPercent = formData.discount_type === "percent";

  const formFields = (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Code</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="SUMMER25"
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
        <Label>Description (Optional)</Label>
        <Input
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Summer campaign 25% off"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Discount Type</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(v) => setFormData({ ...formData, discount_type: v as "amount" | "percent" })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent (%)</SelectItem>
              <SelectItem value="amount">Fixed amount (sum)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{isPercent ? "Percent (0-100)" : "Amount (sum)"}</Label>
          <Input
            type="number"
            value={formData.discount_value ?? ""}
            onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Max % of order (Optional)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            placeholder="e.g. 25, 50, 100"
            value={formData.max_discount_percent ?? ""}
            onChange={(e) => setFormData({ ...formData, max_discount_percent: numOrUndef(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max discount amount (Optional)</Label>
          <Input
            type="number"
            placeholder="absolute cap in sum"
            value={formData.max_discount_amount ?? ""}
            onChange={(e) => setFormData({ ...formData, max_discount_amount: numOrUndef(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Min order (sum)</Label>
          <Input
            type="number"
            value={formData.min_order_amount ?? 0}
            onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Total uses (Optional)</Label>
          <Input
            type="number"
            placeholder="unlimited"
            value={formData.usage_limit ?? ""}
            onChange={(e) => setFormData({ ...formData, usage_limit: numOrUndef(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Per-user uses</Label>
          <Input
            type="number"
            value={formData.per_user_limit ?? 1}
            onChange={(e) => setFormData({ ...formData, per_user_limit: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Partner (Optional — scope to one partner)</Label>
        <Select
          value={formData.partner_id ? String(formData.partner_id) : "all"}
          onValueChange={(v) => setFormData({ ...formData, partner_id: v === "all" ? undefined : Number(v) })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="All partners" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All partners</SelectItem>
            {partners.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Specific account (Optional — reserve for one user)</Label>
        <AccountPicker
          value={formData.user_id}
          onChange={(id) => setFormData({ ...formData, user_id: id })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Starts At (Optional)</Label>
          <DateTimePicker
            value={formData.starts_at || ""}
            onChange={(v) => setFormData({ ...formData, starts_at: v })}
            onClear={() => setFormData({ ...formData, starts_at: "" })}
          />
        </div>
        <div className="space-y-2">
          <Label>Expires At (Optional)</Label>
          <DateTimePicker
            value={formData.expires_at || ""}
            onChange={(v) => setFormData({ ...formData, expires_at: v })}
            onClear={() => setFormData({ ...formData, expires_at: "" })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promocodes"
        description="Create and manage discount codes customers can apply at checkout."
        action={
          <Button
            onClick={() => {
              setFormData(defaultForm);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add promocode
          </Button>
        }
      />

      <PageToolbar>
        <Input
          placeholder="Search by code…"
          className="w-[220px]"
          value={codeFilter}
          onChange={(e) => {
            setCodeFilter(e.target.value || null);
            setCurrentPage(1);
          }}
        />
        <Select
          value={activeFilter || "all"}
          onValueChange={(v) => {
            setActiveFilter(v === "all" ? null : v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]">ID</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Caps</TableHead>
              <TableHead>Min order</TableHead>
              <TableHead>Usage</TableHead>
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
            ) : promocodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    title="No promocodes yet"
                    description="Discount codes customers can apply at checkout will appear here."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(defaultForm);
                          setIsCreateOpen(true);
                        }}
                      >
                        <Plus className="size-4" />
                        Add promocode
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              promocodes.map((promocode) => (
                <TableRow key={promocode.id}>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{promocode.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm font-medium text-foreground">{promocode.code}</span>
                      {promocode.description && (
                        <span className="max-w-[200px] truncate text-[11px] text-muted-foreground">
                          {promocode.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {promocode.discount_type === "percent"
                      ? `${promocode.discount_value}%`
                      : `${promocode.discount_value.toLocaleString("ru-RU")} sum`}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {promocode.max_discount_percent != null && <span>≤{promocode.max_discount_percent}% </span>}
                    {promocode.max_discount_amount != null && (
                      <span>≤{promocode.max_discount_amount.toLocaleString("ru-RU")}</span>
                    )}
                    {promocode.max_discount_percent == null && promocode.max_discount_amount == null && "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {promocode.min_order_amount > 0 ? promocode.min_order_amount.toLocaleString("ru-RU") : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {promocode.used_count}
                    {promocode.usage_limit != null ? `/${promocode.usage_limit}` : ""}
                    <span className="px-1 text-muted-foreground/60">·</span>
                    {promocode.per_user_limit}/user
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={promocode.is_active}
                      onCheckedChange={(v) => toggleActiveMutation.mutate({ id: promocode.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {promocode.starts_at ? new Date(promocode.starts_at).toLocaleDateString("ru-RU") : "—"}
                    </span>
                    <span className="px-1">→</span>
                    <span className="font-mono tabular-nums">
                      {promocode.expires_at ? new Date(promocode.expires_at).toLocaleDateString("ru-RU") : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(promocode)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(promocode.id)}
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
            <DialogTitle>Create Promocode</DialogTitle>
            <DialogDescription>Add a new discount code</DialogDescription>
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
      <Dialog open={!!editPromocode} onOpenChange={(open) => { if (!open) setEditPromocode(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promocode</DialogTitle>
            <DialogDescription>Update promocode settings</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditPromocode(null)}>Cancel</Button>
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

function extractError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

export default function PromocodesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading promocodes...</div>}>
      <PromocodesContent />
    </Suspense>
  );
}
