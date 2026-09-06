
import { Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString, parseAsBoolean } from "nuqs";
import { toast } from "sonner";
import { Building2, ExternalLink, ReceiptText, Star, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "@/components/pickers/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTableSort } from "@/hooks/use-table-sort";
import { ordersApi, type OrdersGetAllParams } from "@/lib/api/domains/orders";
import { partnersApi } from "@/lib/api/domains/partners";
import { shopsApi } from "@/lib/api/domains/shops";
import { getApiErrorMessage } from "@/lib/api/error";
import type { Order, ChangeOrderStatusRequest } from "@/lib/api/schemas/orders";
import { ORDER_SOURCES, formatOrderSource, orderSourceVariant } from "@/lib/order-source";

const statusTone: Record<string, StatusTone> = {
  pending_payment: "pending",
  pending: "warning",
  processing: "processing",
  completed: "success",
  cancelled: "danger",
};

const statusOptions = [
  "pending_payment",
  "pending",
  "processing",
  "completed",
  "cancelled",
];

const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

import { formatSomUZS } from "@/lib/money";

const formatPrice = (price?: number) => formatSomUZS(price);

const formatDate = (dateStr?: string) => {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleString();
};

function OrdersContent() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [phoneFilter, setPhoneFilter] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [drinkFilter, setDrinkFilter] = useQueryState(
    "drink",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [partnerFilter, setPartnerFilter] = useQueryState("partner_id", parseAsInteger);
  const [shopIdFilter, setShopIdFilter] = useQueryState("shop_id", parseAsInteger);
  const [sourceFilter, setSourceFilter] = useQueryState("source", parseAsString.withDefault("all"));
  const [fromFilter, setFromFilter] = useQueryState("from", parseAsString.withDefault(""));
  const [toFilter, setToFilter] = useQueryState("to", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString.withDefault("all"));
  const [includeTest, setIncludeTest] = useQueryState("include_test", parseAsBoolean.withDefault(false));
  const [itemsDialogOrder, setItemsDialogOrder] = useState<Order | null>(null);
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() =>
    setCurrentPage(1)
  );

  const { data: partners = [] } = useQuery({
    queryKey: ["partners", "for-orders-filter"],
    queryFn: async () => {
      const first = await partnersApi.getAll({ page: 1, limit: 100 });
      const totalPages = first.meta?.totalPages ?? 1;
      let all = first.data ?? [];
      for (let p = 2; p <= totalPages; p++) {
        const next = await partnersApi.getAll({ page: p, limit: 100 });
        all = all.concat(next.data ?? []);
      }
      return all;
    },
  });

  const { data: partnerShops = [] } = useQuery({
    queryKey: ["shops", "by-partner", partnerFilter],
    queryFn: () => shopsApi.getByPartner(partnerFilter!),
    enabled: !!partnerFilter,
  });

  const filterParams: OrdersGetAllParams = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    drink: drinkFilter || undefined,
    from: fromFilter || undefined,
    to: toFilter || undefined,
    partner_id: partnerFilter ?? undefined,
    shop_id: shopIdFilter ?? undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    search: phoneFilter || undefined,
    include_test: includeTest || undefined,
  };

  const { data: ordersData, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", currentPage, perPage, statusFilter, drinkFilter, fromFilter, toFilter, phoneFilter, partnerFilter, shopIdFilter, sourceFilter, includeTest, sortParam, orderParam],
    queryFn: () =>
      ordersApi.getAll({
        ...filterParams,
        page: currentPage,
        limit: perPage,
        sort: sortParam,
        order: orderParam,
      }),
  });

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta;
  const totalPages = meta?.totalPages || 1;

  const statusMutation = useMutation({
    mutationFn: (data: ChangeOrderStatusRequest) => ordersApi.changeStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    statusMutation.mutate({ id: orderId, status: newStatus });
  };

  const fiscalizeMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.fiscalize(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Fiscalization requested");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to fiscalize order")),
  });

  const clearFilters = () => {
    setPhoneFilter(null);
    setDrinkFilter(null);
    setPartnerFilter(null);
    setShopIdFilter(null);
    setSourceFilter(null);
    setFromFilter(null);
    setToFilter(null);
    setStatusFilter(null);
    setIncludeTest(null);
    setCurrentPage(1);
  };

  const handleRangeChange = (from: string | null, to: string | null) => {
    setFromFilter(from);
    setToFilter(to);
    setCurrentPage(1);
  };

  const handlePartnerChange = (value: string) => {
    setPartnerFilter(value === "all" ? null : Number(value));
    setShopIdFilter(null);
    setCurrentPage(1);
  };

  const hasFilters =
    !!phoneFilter ||
    !!drinkFilter ||
    !!partnerFilter ||
    !!shopIdFilter ||
    sourceFilter !== "all" ||
    !!fromFilter ||
    !!toFilter ||
    statusFilter !== "all" ||
    includeTest;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Manage and track all orders across shops." />

      <PageToolbar className="flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker from={fromFilter} to={toFilter} onChange={handleRangeChange} />

            <Select value={partnerFilter ? String(partnerFilter) : "all"} onValueChange={handlePartnerChange}>
              <SelectTrigger size="sm" className="w-52">
                <Building2 className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All partners</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={String(partner.id)}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={shopIdFilter ? String(shopIdFilter) : "all"}
              onValueChange={(val) => {
                setShopIdFilter(val === "all" ? null : Number(val));
                setCurrentPage(1);
              }}
              disabled={!partnerFilter}
            >
              <SelectTrigger size="sm" className="w-52">
                <Store className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shops</SelectItem>
                {partnerShops.map((shop) => (
                  <SelectItem key={shop.id} value={String(shop.id)}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sourceFilter}
              onValueChange={(val) => {
                setSourceFilter(val === "all" ? null : val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-44">
                <span className="text-muted-foreground">Source:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {ORDER_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {formatOrderSource(source)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val === "all" ? null : val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-52">
                <span className="text-muted-foreground">Status:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={phoneFilter}
              onChange={(val) => {
                setPhoneFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Customer phone…"
              className="w-52"
            />
            <SearchInput
              value={drinkFilter}
              onChange={(val) => {
                setDrinkFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Search by product…"
              className="w-52"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={includeTest}
              onCheckedChange={(checked) => {
                setIncludeTest(checked === true ? true : null);
                setCurrentPage(1);
              }}
            />
            Include test partners
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            Clear filters
          </Button>
        </div>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead column="id" sort={sort} order={order} onSort={onSort}>
                Order
              </SortableTableHead>
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
              <SortableTableHead column="price" sort={sort} order={order} onSort={onSort}>
                Price
              </SortableTableHead>
              <TableHead>Shop</TableHead>
              <SortableTableHead column="source" sort={sort} order={order} onSort={onSort}>
                Source
              </SortableTableHead>
              <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                Time
              </SortableTableHead>
              <SortableTableHead column="updated_at" sort={sort} order={order} onSort={onSort}>
                Updated
              </SortableTableHead>
              <TableHead>Feedback</TableHead>
              <SortableTableHead column="status" sort={sort} order={order} onSort={onSort}>
                Status
              </SortableTableHead>
              <TableHead className="text-right">Action</TableHead>
              <TableHead className="text-center">Fiscal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Couldn't load orders. Check your connection and try again.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="p-0">
                  <EmptyState
                    title="No orders found"
                    description={
                      hasFilters
                        ? "Try adjusting or clearing your filters."
                        : "Orders will appear here as soon as they come in."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: Order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs tabular-nums">#{order.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{order.user?.name || "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.user?.phone_number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.items && order.items.length > 1 ? (
                      <button
                        type="button"
                        className="underline-offset-2 hover:underline"
                        onClick={() => setItemsDialogOrder(order)}
                      >
                        {order.drink?.name || `${order.items.length} items`}
                      </button>
                    ) : (
                      order.drink?.name || "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {formatPrice(order.price)}{" "}
                    <span className="text-xs text-muted-foreground">UZS</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.shop ? (
                      <Link
                        to={`/shops/${order.shop.id}`}
                        className="text-foreground underline-offset-2 hover:underline"
                      >
                        {order.shop.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={orderSourceVariant(order.source)}>
                      {formatOrderSource(order.source)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(order.time)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(order.last_update)}
                  </TableCell>
                  <TableCell>
                    {order.feedback ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-foreground">
                          <Star className="size-3 fill-foreground text-foreground" />
                          {order.feedback.rating}/5
                        </span>
                        {order.feedback.comment && (
                          <span
                            className="max-w-[140px] truncate text-xs text-muted-foreground"
                            title={order.feedback.comment}
                          >
                            {order.feedback.comment}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={formatStatus(order.status)}
                      tone={statusTone[order.status] ?? "neutral"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger size="sm" className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status} className="text-xs">
                              {formatStatus(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {order.status === "completed" && (order.fiscal_link?.trim() ? (
                      <Button asChild variant="outline" size="icon-sm" title="Open fiscal receipt">
                        <a
                          href={order.fiscal_link.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open fiscal receipt"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => fiscalizeMutation.mutate(order.id)}
                        disabled={fiscalizeMutation.isPending}
                        title="Fiscalize order"
                        aria-label="Fiscalize order"
                      >
                        <ReceiptText className="size-4" />
                      </Button>
                    ))}
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
        open={!!itemsDialogOrder}
        onOpenChange={(open) => {
          if (!open) setItemsDialogOrder(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order #{itemsDialogOrder?.id} items</DialogTitle>
            <DialogDescription>Line items for this order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {itemsDialogOrder?.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatPrice(item.price * item.quantity)} UZS
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ErrorBoundary pageName="Orders">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading orders…
          </div>
        }
      >
        <OrdersContent />
      </Suspense>
    </ErrorBoundary>
  );
}
