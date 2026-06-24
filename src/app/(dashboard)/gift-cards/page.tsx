import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CalendarIcon, X, Check, ChevronsUpDown, Wallet, History } from "lucide-react";
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
import { giftCardsApi } from "@/lib/api/domains/gift-cards";
import { usersApi } from "@/lib/api/domains/users";
import type { GiftCard, CreateGiftCardRequest } from "@/lib/api/schemas/gift-cards";

function isoToApi(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function sum(n: number) { return n.toLocaleString("ru-RU"); }

function extractError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

const defaultForm: CreateGiftCardRequest = {
  code: "",
  initial_balance: 100000,
  currency: "uzs",
  is_active: true,
  expires_at: "",
};

function DatePicker({ value, onChange, onClear }: { value: string; onChange: (iso: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;
  const hasValue = !!value && !isNaN(new Date(value).getTime());
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !hasValue && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {hasValue ? format(date!, "dd/MM/yyyy") : "No expiry"}
          {hasValue && (
            <span role="button" tabIndex={0} className="ml-auto"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClear(); } }}>
              <X className="h-4 w-4 opacity-50 hover:opacity-100" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={(d) => { if (d) onChange(d.toISOString()); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}

function AccountPicker({ value, onChange }: { value: number | undefined; onChange: (id: number | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = useQuery({
    queryKey: ["giftcard-users-search", search],
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
                <CommandItem key={u.id} value={String(u.id)} onSelect={() => { onChange(u.id); setOpen(false); }}>
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

function GiftCardsContent() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [codeFilter, setCodeFilter] = useQueryState("code", parseAsString.withDefault(""));
  const [activeFilter, setActiveFilter] = useQueryState("active", parseAsString.withDefault(""));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateGiftCardRequest>(defaultForm);
  const [topUpCard, setTopUpCard] = useState<GiftCard | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [historyCardId, setHistoryCardId] = useState<number | null>(null);

  const { data: cardsData, isLoading } = useQuery({
    queryKey: ["gift-cards", currentPage, perPage, codeFilter, activeFilter],
    queryFn: () => giftCardsApi.getAll({
      page: currentPage,
      limit: perPage,
      code: codeFilter || undefined,
      is_active: activeFilter === "" ? undefined : activeFilter === "true",
    }),
  });
  const cards = cardsData?.data || [];
  const totalPages = cardsData?.meta?.totalPages || 1;

  const { data: historyDetail } = useQuery({
    queryKey: ["gift-card-detail", historyCardId],
    queryFn: () => giftCardsApi.getById(historyCardId as number),
    enabled: historyCardId != null,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["gift-cards"] });

  const createMutation = useMutation({
    mutationFn: (data: CreateGiftCardRequest) => giftCardsApi.create(data),
    onSuccess: () => { invalidate(); toast.success("Gift card created!"); setIsCreateOpen(false); setFormData(defaultForm); },
    onError: (err: unknown) => toast.error(extractError(err, "Failed to create gift card")),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => giftCardsApi.update(id, { is_active }),
    onSuccess: () => { invalidate(); toast.success("Status updated!"); },
    onError: () => toast.error("Failed to update status"),
  });

  const topUpMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => giftCardsApi.topUp(id, amount),
    onSuccess: () => { invalidate(); toast.success("Balance topped up!"); setTopUpCard(null); setTopUpAmount(0); },
    onError: (err: unknown) => toast.error(extractError(err, "Failed to top up")),
  });

  const deleteMutation = useMutation({
    mutationFn: giftCardsApi.delete,
    onSuccess: () => { invalidate(); toast.success("Gift card deleted!"); },
    onError: () => toast.error("Failed to delete gift card"),
  });

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...formData };
    payload.code = payload.code.trim();
    if (payload.expires_at) payload.expires_at = isoToApi(payload.expires_at);
    createMutation.mutate(payload);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gift Cards"
        description="Issue prepaid gift cards customers spend down at checkout."
        action={
          <Button onClick={() => { setFormData(defaultForm); setIsCreateOpen(true); }}>
            <Plus className="size-4" />
            Issue gift card
          </Button>
        }
      />

      <PageToolbar>
        <Input placeholder="Search by code…" className="w-[220px]" value={codeFilter}
          onChange={(e) => { setCodeFilter(e.target.value || null); setCurrentPage(1); }} />
        <Select value={activeFilter || "all"} onValueChange={(v) => { setActiveFilter(v === "all" ? null : v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
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
              <TableHead>Balance</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : cards.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="p-0">
                <EmptyState title="No gift cards yet"
                  description="Prepaid gift cards you issue will appear here."
                  action={<Button variant="outline" size="sm" onClick={() => { setFormData(defaultForm); setIsCreateOpen(true); }}>
                    <Plus className="size-4" />Issue gift card</Button>} />
              </TableCell></TableRow>
            ) : (
              cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">#{card.id}</TableCell>
                  <TableCell className="font-mono text-sm font-medium text-foreground">{card.code}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="num-tabular text-sm font-semibold text-foreground">{sum(card.balance)} <span className="text-xs font-normal uppercase text-muted-foreground">{card.currency}</span></span>
                      <span className="text-[11px] text-muted-foreground">of {sum(card.initial_balance)} issued</span>
                    </div>
                  </TableCell>
                  <TableCell className="num-tabular text-xs text-muted-foreground">{sum(card.initial_balance)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{card.user_id ? `#${card.user_id}` : "Anyone"}</TableCell>
                  <TableCell>
                    <Switch checked={card.is_active} onCheckedChange={(v) => toggleActiveMutation.mutate({ id: card.id, is_active: v })} />
                  </TableCell>
                  <TableCell className="num-tabular text-xs text-muted-foreground">
                    {card.expires_at ? new Date(card.expires_at).toLocaleDateString("ru-RU") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" title="Top up" onClick={() => { setTopUpCard(card); setTopUpAmount(0); }}>
                        <Wallet className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="History" onClick={() => setHistoryCardId(card.id)}>
                        <History className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" title="Delete"
                        onClick={() => deleteMutation.mutate(card.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
          perPage={perPage} onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }} isLoading={isLoading} />
      </DataTableShell>

      {/* Create */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Gift Card</DialogTitle>
            <DialogDescription>Create a prepaid card with an opening balance</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="GIFT-A1B2C3" />
                </div>
                <div className="flex items-end gap-3 pb-1">
                  <Switch checked={formData.is_active ?? true} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Opening balance (sum)</Label>
                  <Input type="number" value={formData.initial_balance ?? 0}
                    onChange={(e) => setFormData({ ...formData, initial_balance: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={formData.currency || "uzs"} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Specific account (Optional — reserve for one user)</Label>
                <AccountPicker value={formData.user_id} onChange={(id) => setFormData({ ...formData, user_id: id })} />
              </div>
              <div className="space-y-2">
                <Label>Expires (Optional)</Label>
                <DatePicker value={formData.expires_at || ""} onChange={(v) => setFormData({ ...formData, expires_at: v })} onClear={() => setFormData({ ...formData, expires_at: "" })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Issue"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Top up */}
      <Dialog open={!!topUpCard} onOpenChange={(o) => { if (!o) setTopUpCard(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Top up {topUpCard?.code}</DialogTitle>
            <DialogDescription>Current balance: {topUpCard ? sum(topUpCard.balance) : 0} {topUpCard?.currency}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Amount to add (sum)</Label>
            <Input type="number" value={topUpAmount || ""} onChange={(e) => setTopUpAmount(Number(e.target.value))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTopUpCard(null)}>Cancel</Button>
            <Button disabled={topUpMutation.isPending || topUpAmount <= 0}
              onClick={() => topUpCard && topUpMutation.mutate({ id: topUpCard.id, amount: topUpAmount })}>
              {topUpMutation.isPending ? "Adding..." : "Add balance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={historyCardId != null} onOpenChange={(o) => { if (!o) setHistoryCardId(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transactions — {historyDetail?.code}</DialogTitle>
            <DialogDescription>Balance: {historyDetail ? sum(historyDetail.balance) : "…"} {historyDetail?.currency}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {!historyDetail?.transactions?.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Balance after</TableHead><TableHead>Order</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {historyDetail.transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell><span className={cn("rounded px-2 py-0.5 text-[11px] font-medium",
                        t.type === "redeem" ? "bg-amber-100 text-amber-800" : t.type === "refund" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800")}>{t.type}</span></TableCell>
                      <TableCell className="num-tabular text-sm">{t.type === "redeem" ? "−" : "+"}{sum(t.amount)}</TableCell>
                      <TableCell className="num-tabular text-sm text-muted-foreground">{sum(t.balance_after)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.order_id ? `#${t.order_id}` : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("ru-RU")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GiftCardsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading gift cards...</div>}>
      <GiftCardsContent />
    </Suspense>
  );
}
