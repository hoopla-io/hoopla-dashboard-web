import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { settlementsApi } from "@/lib/api/domains/settlements";
import { shopsApi } from "@/lib/api/domains/shops";
import { formatSomUZS } from "@/lib/money";
import type { Settlement, SettlementPayment, SettlementStatus } from "@/lib/api/schemas/settlements";
import type { SortOrder } from "@/lib/api/types";

function useLocalSort(onChange: () => void) {
  const [sort, setSort] = useState("");
  const [order, setOrder] = useState<SortOrder>("asc");

  const onSort = (column: string) => {
    if (sort !== column) {
      setSort(column);
      setOrder("asc");
    } else if (order === "asc") {
      setOrder("desc");
    } else {
      setSort("");
    }
    onChange();
  };

  return { sort, order, onSort, sortParam: sort || undefined, orderParam: sort ? order : undefined };
}

const pad = (n: number) => String(n).padStart(2, "0");
const fmtLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Treat [startDate, endDate] as full local days; period_end is exclusive
// (start of the day after endDate).
function toISORange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const endExclusive = new Date(`${endDate}T00:00:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return { start: start.toISOString(), end: endExclusive.toISOString() };
}

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
const fmtDateTime = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");

const statusTone = (status: string): StatusTone => (status === "paid" ? "success" : "warning");

interface SettlementsPanelProps {
  partnerId: number;
}

export function SettlementsPanel({ partnerId }: SettlementsPanelProps) {
  const queryClient = useQueryClient();

  const now = new Date();
  const [startDate, setStartDate] = useState(fmtLocal(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(fmtLocal(now));
  const [shopFilter, setShopFilter] = useState<"ALL" | number>("ALL");
  const [payment, setPayment] = useState<SettlementPayment>("all");
  const [batchStatus, setBatchStatus] = useState<SettlementStatus>("all");

  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(10);
  const [batchesPage, setBatchesPage] = useState(1);
  const [batchesLimit, setBatchesLimit] = useState(10);
  const ordersSort = useLocalSort(() => setOrdersPage(1));
  const batchesSort = useLocalSort(() => setBatchesPage(1));

  const [createOpen, setCreateOpen] = useState(false);
  const [viewBatch, setViewBatch] = useState<Settlement | null>(null);

  const rangeValid = !!startDate && !!endDate && startDate <= endDate;
  const { start: periodStart, end: periodEnd } = useMemo(
    () => (rangeValid ? toISORange(startDate, endDate) : { start: "", end: "" }),
    [rangeValid, startDate, endDate]
  );
  const shopId = shopFilter === "ALL" ? undefined : shopFilter;

  const { data: shops = [] } = useQuery({
    queryKey: ["shops", partnerId],
    queryFn: () => shopsApi.getByPartner(partnerId),
    enabled: !!partnerId,
  });

  const ordersQuery = useQuery({
    queryKey: ["settlement_orders", partnerId, shopId ?? "all", periodStart, periodEnd, payment, ordersPage, ordersLimit, ordersSort.sortParam, ordersSort.orderParam],
    queryFn: () =>
      settlementsApi.orders({
        partner_id: partnerId,
        shop_id: shopId,
        period_start: periodStart,
        period_end: periodEnd,
        payment,
        page: ordersPage,
        limit: ordersLimit,
        sort: ordersSort.sortParam,
        order: ordersSort.orderParam,
      }),
    enabled: !!partnerId && rangeValid,
  });

  const batchesQuery = useQuery({
    queryKey: ["settlement_batches", partnerId, shopId ?? "all", batchStatus, batchesPage, batchesLimit, batchesSort.sortParam, batchesSort.orderParam],
    queryFn: () =>
      settlementsApi.list({
        partner_id: partnerId,
        shop_id: shopId,
        status: batchStatus === "all" ? undefined : batchStatus,
        page: batchesPage,
        limit: batchesLimit,
        sort: batchesSort.sortParam,
        order: batchesSort.orderParam,
      }),
    enabled: !!partnerId,
  });

  const viewQuery = useQuery({
    queryKey: ["settlement_show", viewBatch?.id],
    queryFn: () => settlementsApi.show(viewBatch!.id),
    enabled: !!viewBatch,
  });

  const summary = ordersQuery.data?.meta?.summary;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["settlement_orders"] });
    queryClient.invalidateQueries({ queryKey: ["settlement_batches"] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      settlementsApi.create({
        partner_id: partnerId,
        shop_id: shopId ?? null,
        period_start: periodStart,
        period_end: periodEnd,
      }),
    onSuccess: (res) => {
      invalidate();
      setCreateOpen(false);
      toast.success(
        `Settlement created: ${res.orders_count} order(s), ${formatSomUZS(res.total_amount)} UZS`
      );
    },
    onError: () =>
      toast.error("Failed to create settlement (no eligible unsettled completed orders?)"),
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => settlementsApi.pay(id),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["settlement_show"] });
      toast.success("Settlement marked as paid");
    },
    onError: () => toast.error("Failed to mark settlement paid"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => settlementsApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Settlement deleted");
    },
    onError: () => toast.error("Failed to delete settlement (paid batches cannot be deleted)"),
  });

  const orders = ordersQuery.data?.data ?? [];
  const ordersMeta = ordersQuery.data?.meta;
  const batches = batchesQuery.data?.data ?? [];
  const batchesMeta = batchesQuery.data?.meta;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:flex-wrap md:items-end">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setOrdersPage(1); }}
            className="md:w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setOrdersPage(1); }}
            className="md:w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Shop</Label>
          <Select
            value={shopFilter === "ALL" ? "ALL" : String(shopFilter)}
            onValueChange={(v) => { setShopFilter(v === "ALL" ? "ALL" : Number(v)); setOrdersPage(1); setBatchesPage(1); }}
          >
            <SelectTrigger className="md:w-48"><SelectValue placeholder="All shops" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All shops</SelectItem>
              {shops.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:ml-auto">
          <Button onClick={() => setCreateOpen(true)} disabled={!rangeValid}>
            <Wallet className="mr-2 h-4 w-4" />
            Create settlement
          </Button>
        </div>
      </div>

      {/* Summary — period overview over ALL orders in range (not affected by the
          Payment filter on the Orders tab). */}
      {summary && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Period overview (all orders in range)</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <SummaryStat label="Orders" value={String(summary.orders_count)} />
          <SummaryStat label="Gross (UZS)" value={formatSomUZS(summary.gross_som)} />
          <SummaryStat label="Payout (UZS)" value={formatSomUZS(summary.payout_som)} />
          <SummaryStat label="Paid" value={String(summary.paid_count)} />
          <SummaryStat label="Unpaid" value={String(summary.unpaid_count)} />
          </div>
        </div>
      )}

      <Tabs defaultValue="orders" className="space-y-3">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="batches">Settlement batches</TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="orders" className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Payment</Label>
            <Select value={payment} onValueChange={(v) => { setPayment(v as SettlementPayment); setOrdersPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid by Hoopla</SelectItem>
                <SelectItem value="unpaid">Not paid yet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="id" sort={ordersSort.sort} order={ordersSort.order} onSort={ordersSort.onSort}>
                      Order
                    </SortableTableHead>
                    <TableHead>Drink</TableHead>
                    <TableHead>Shop</TableHead>
                    <SortableTableHead column="price" sort={ordersSort.sort} order={ordersSort.order} onSort={ordersSort.onSort}>
                      Price
                    </SortableTableHead>
                    <TableHead>Payout</TableHead>
                    <SortableTableHead column="created_at" sort={ordersSort.sort} order={ordersSort.order} onSort={ordersSort.onSort}>
                      Date
                    </SortableTableHead>
                    <TableHead>Hoopla paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!rangeValid ? (
                    <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Pick a valid date range</TableCell></TableRow>
                  ) : ordersQuery.isLoading ? (
                    <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No completed orders in this range</TableCell></TableRow>
                  ) : (
                    orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">#{o.id}</TableCell>
                        <TableCell className="text-sm">{o.drink_name || "—"}</TableCell>
                        <TableCell className="text-sm">{o.shop_name || "—"}</TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">{formatSomUZS(o.price)}</TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">{formatSomUZS(o.payout)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDateTime(o.created_at)}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={o.hoopla_paid ? "Paid" : "Not paid"}
                            tone={o.hoopla_paid ? "success" : "neutral"}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={ordersPage}
                totalPages={ordersMeta?.totalPages || 1}
                onPageChange={setOrdersPage}
                perPage={ordersLimit}
                onPerPageChange={(n) => { setOrdersLimit(n); setOrdersPage(1); }}
                isLoading={ordersQuery.isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batches */}
        <TabsContent value="batches" className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Status</Label>
            <Select value={batchStatus} onValueChange={(v) => { setBatchStatus(v as SettlementStatus); setBatchesPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="period_start" sort={batchesSort.sort} order={batchesSort.order} onSort={batchesSort.onSort}>
                      Period
                    </SortableTableHead>
                    <TableHead>Shop</TableHead>
                    <SortableTableHead column="orders_count" sort={batchesSort.sort} order={batchesSort.order} onSort={batchesSort.onSort}>
                      Orders
                    </SortableTableHead>
                    <SortableTableHead column="total_amount" sort={batchesSort.sort} order={batchesSort.order} onSort={batchesSort.onSort}>
                      Payout
                    </SortableTableHead>
                    <SortableTableHead column="status" sort={batchesSort.sort} order={batchesSort.order} onSort={batchesSort.onSort}>
                      Status
                    </SortableTableHead>
                    <SortableTableHead column="paid_at" sort={batchesSort.sort} order={batchesSort.order} onSort={batchesSort.onSort}>
                      Paid at
                    </SortableTableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchesQuery.isLoading ? (
                    <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : batches.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No settlement batches yet</TableCell></TableRow>
                  ) : (
                    batches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-sm">{fmtDate(b.period_start)} – {fmtDate(b.period_end)}</TableCell>
                        <TableCell className="text-sm">{b.shop_name || "All shops"}</TableCell>
                        <TableCell className="text-sm tabular-nums">{b.orders_count}</TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">{formatSomUZS(b.total_amount)}</TableCell>
                        <TableCell><StatusBadge label={b.status} tone={statusTone(b.status)} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(b.paid_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewBatch(b)}>View</Button>
                            {b.status !== "paid" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={payMutation.isPending}
                                  onClick={() => {
                                    if (confirm("Mark this settlement as PAID? This records that Hoopla has paid the partner.")) {
                                      payMutation.mutate(b.id);
                                    }
                                  }}
                                >
                                  Mark paid
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => {
                                    if (confirm("Delete this pending settlement? Its orders become unsettled again.")) {
                                      deleteMutation.mutate(b.id);
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={batchesPage}
                totalPages={batchesMeta?.totalPages || 1}
                onPageChange={setBatchesPage}
                perPage={batchesLimit}
                onPerPageChange={(n) => { setBatchesLimit(n); setBatchesPage(1); }}
                isLoading={batchesQuery.isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create confirm dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create settlement batch</DialogTitle>
            <DialogDescription>
              Settle all completed, not-yet-settled orders for{" "}
              {shopId ? shops.find((s) => s.id === shopId)?.name ?? "the selected shop" : "all shops"}{" "}
              between {startDate} and {endDate}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            {summary ? (
              <p>
                <span className="font-medium text-foreground">{summary.unsettled_count}</span> completed order(s)
                in this range are not yet in any settlement and will be included. The exact set is recomputed on the server.
              </p>
            ) : (
              <p>Eligible orders are computed on the server when you confirm.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !rangeValid}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View batch dialog */}
      <Dialog open={!!viewBatch} onOpenChange={(open) => { if (!open) setViewBatch(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settlement #{viewBatch?.id}</DialogTitle>
            <DialogDescription>
              {viewBatch ? `${fmtDate(viewBatch.period_start)} – ${fmtDate(viewBatch.period_end)} · ${viewBatch.shop_name || "All shops"}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Drink</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewQuery.isLoading ? (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">Loading…</TableCell></TableRow>
                ) : (viewQuery.data?.orders ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No orders</TableCell></TableRow>
                ) : (
                  (viewQuery.data?.orders ?? []).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">#{o.id}</TableCell>
                      <TableCell className="text-sm">{o.drink_name || "—"}</TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">{formatSomUZS(o.price)}</TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">{formatSomUZS(o.payout)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDateTime(o.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            {viewBatch && viewQuery.data && viewQuery.data.status !== "paid" && (
              <Button
                variant="outline"
                disabled={payMutation.isPending || viewQuery.isLoading}
                onClick={() => {
                  if (confirm("Mark this settlement as PAID?")) payMutation.mutate(viewBatch.id);
                }}
              >
                Mark paid
              </Button>
            )}
            <Button onClick={() => setViewBatch(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
