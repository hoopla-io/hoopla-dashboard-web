import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

import type { PushNotificationsFilterParams } from "@/lib/api/domains/push-notifications";

export function usePushNotificationFilters() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [kind, setKind] = useQueryState("kind", parseAsString.withDefault("all"));
  const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
  const [from, setFrom] = useQueryState("from", parseAsString.withDefault(""));
  const [to, setTo] = useQueryState("to", parseAsString.withDefault(""));

  const statsParams: PushNotificationsFilterParams = {
    kind: kind !== "all" ? kind : undefined,
    search: search || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const params: PushNotificationsFilterParams = {
    ...statsParams,
    status: status !== "all" ? status : undefined,
  };

  const hasFilters = !!search || kind !== "all" || status !== "all" || !!from || !!to;

  const changeKind = (value: string) => {
    setKind(value === "all" ? null : value);
    setPage(1);
  };

  const changeStatus = (value: string) => {
    setStatus(value === "all" ? null : value);
    setPage(1);
  };

  const changeSearch = (value: string | null) => {
    setSearch(value);
    setPage(1);
  };

  const changeRange = (nextFrom: string | null, nextTo: string | null) => {
    setFrom(nextFrom);
    setTo(nextTo);
    setPage(1);
  };

  const changePerPage = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const clear = () => {
    setSearch(null);
    setKind(null);
    setStatus(null);
    setFrom(null);
    setTo(null);
    setPage(1);
  };

  return {
    page,
    setPage,
    perPage,
    changePerPage,
    search,
    kind,
    status,
    from,
    to,
    params,
    statsParams,
    hasFilters,
    changeKind,
    changeStatus,
    changeSearch,
    changeRange,
    clear,
  };
}
