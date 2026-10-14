import { useQueryState, parseAsInteger, parseAsString, parseAsBoolean } from "nuqs";

import type { OrdersGetAllParams } from "@/lib/api/domains/orders";
import type { OrdersAnalyticsParams } from "@/lib/api/domains/analytics";

export function useOrdersFilters() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [drink, setDrink] = useQueryState(
    "drink",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [partnerId, setPartnerId] = useQueryState("partner_id", parseAsInteger);
  const [shopId, setShopId] = useQueryState("shop_id", parseAsInteger);
  const [source, setSource] = useQueryState("source", parseAsString.withDefault("all"));
  const [payment, setPayment] = useQueryState("payment", parseAsString.withDefault("all"));
  const [isPaid, setIsPaid] = useQueryState("is_paid", parseAsString.withDefault("all"));
  const [from, setFrom] = useQueryState("from", parseAsString.withDefault(""));
  const [to, setTo] = useQueryState("to", parseAsString.withDefault(""));
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
  const [includeTest, setIncludeTest] = useQueryState("include_test", parseAsBoolean.withDefault(false));

  const resetPage = () => setPage(1);

  const listParams: OrdersGetAllParams = {
    status: status !== "all" ? status : undefined,
    drink: drink || undefined,
    from: from || undefined,
    to: to || undefined,
    partner_id: partnerId ?? undefined,
    shop_id: shopId ?? undefined,
    source: source !== "all" ? source : undefined,
    payment: payment !== "all" ? payment : undefined,
    is_paid: isPaid !== "all" ? isPaid : undefined,
    search: search || undefined,
    include_test: includeTest || undefined,
  };

  const analyticsParams: OrdersAnalyticsParams = {
    from: from || undefined,
    to: to || undefined,
    partner_id: partnerId ?? undefined,
    shop_id: shopId ?? undefined,
    source: source !== "all" ? source : undefined,
    include_test: includeTest || undefined,
  };

  const hasFilters =
    !!search ||
    !!drink ||
    !!partnerId ||
    !!shopId ||
    source !== "all" ||
    payment !== "all" ||
    isPaid !== "all" ||
    !!from ||
    !!to ||
    status !== "all" ||
    includeTest;

  const clear = () => {
    setSearch(null);
    setDrink(null);
    setPartnerId(null);
    setShopId(null);
    setSource(null);
    setPayment(null);
    setIsPaid(null);
    setFrom(null);
    setTo(null);
    setStatus(null);
    setIncludeTest(null);
    resetPage();
  };

  return {
    page,
    setPage,
    search,
    setSearch: (v: string | null) => { setSearch(v); resetPage(); },
    drink,
    setDrink: (v: string | null) => { setDrink(v); resetPage(); },
    partnerId,
    setPartnerId: (v: number | null) => { setPartnerId(v); setShopId(null); resetPage(); },
    shopId,
    setShopId: (v: number | null) => { setShopId(v); resetPage(); },
    source,
    setSource: (v: string | null) => { setSource(v); resetPage(); },
    payment,
    setPayment: (v: string | null) => { setPayment(v); resetPage(); },
    isPaid,
    setIsPaid: (v: string | null) => { setIsPaid(v); resetPage(); },
    from,
    to,
    setRange: (f: string | null, t: string | null) => { setFrom(f); setTo(t); resetPage(); },
    status,
    setStatus: (v: string | null) => { setStatus(v); resetPage(); },
    includeTest,
    setIncludeTest: (v: boolean | null) => { setIncludeTest(v); resetPage(); },
    listParams,
    analyticsParams,
    hasFilters,
    clear,
  };
}

export type OrdersFiltersState = ReturnType<typeof useOrdersFilters>;
