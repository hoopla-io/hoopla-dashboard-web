import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTableSort } from "@/hooks/use-table-sort";
import { pushNotificationsApi } from "@/lib/api/domains/push-notifications";
import type { PushNotification } from "@/lib/api/schemas/push-notifications";
import { usePushNotificationFilters } from "./hooks/usePushNotificationFilters";
import { PushStats } from "./components/PushStats";
import { PushFilters } from "./components/PushFilters";
import { PushTable } from "./components/PushTable";
import { PushDetailDialog } from "./components/PushDetailDialog";

function PushNotificationsContent() {
  const filters = usePushNotificationFilters();
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() => filters.setPage(1));
  const [selected, setSelected] = useState<PushNotification | null>(null);

  const listQuery = useQuery({
    queryKey: ["push-notifications", filters.params, filters.page, filters.perPage, sortParam, orderParam],
    queryFn: () =>
      pushNotificationsApi.getAll({
        ...filters.params,
        page: filters.page,
        limit: filters.perPage,
        sort: sortParam,
        order: orderParam,
      }),
  });

  const statsQuery = useQuery({
    queryKey: ["push-notifications", "stats", filters.statsParams],
    queryFn: () => pushNotificationsApi.getStats(filters.statsParams),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Push Notifications"
        description="Every push the customer API tried to deliver: order status updates and reminders."
      />

      <PushStats
        stats={statsQuery.data}
        isLoading={statsQuery.isLoading}
        kind={filters.kind}
        status={filters.status}
        onKindChange={filters.changeKind}
        onStatusChange={filters.changeStatus}
      />

      <PushFilters
        search={filters.search}
        kind={filters.kind}
        status={filters.status}
        from={filters.from}
        to={filters.to}
        hasFilters={filters.hasFilters}
        onSearchChange={filters.changeSearch}
        onKindChange={filters.changeKind}
        onStatusChange={filters.changeStatus}
        onRangeChange={filters.changeRange}
        onClear={filters.clear}
      />

      <DataTableShell>
        <PushTable
          items={listQuery.data?.data ?? []}
          isLoading={listQuery.isLoading}
          isError={listQuery.isError}
          hasFilters={filters.hasFilters}
          sort={sort}
          order={order}
          onSort={onSort}
          onRetry={() => listQuery.refetch()}
          onSelect={setSelected}
        />
        <PaginationControls
          currentPage={filters.page}
          totalPages={listQuery.data?.meta?.totalPages || 1}
          onPageChange={(p) => filters.setPage(p)}
          perPage={filters.perPage}
          onPerPageChange={filters.changePerPage}
          isLoading={listQuery.isLoading}
        />
      </DataTableShell>

      <PushDetailDialog notification={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function PushNotificationsPage() {
  return (
    <ErrorBoundary pageName="Push Notifications">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading push notifications…
          </div>
        }
      >
        <PushNotificationsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
