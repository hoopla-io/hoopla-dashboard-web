import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { pushNotificationsApi } from "@/lib/api/domains/push-notifications";
import type { PushNotification } from "@/lib/api/schemas/push-notifications";
import { PushTable } from "@/app/(dashboard)/push-notifications/components/PushTable";
import { PushDetailDialog } from "@/app/(dashboard)/push-notifications/components/PushDetailDialog";

interface NotificationsTabProps {
  userId: number;
}

export function NotificationsTab({ userId }: NotificationsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<PushNotification | null>(null);
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() => setCurrentPage(1));

  const listQuery = useQuery({
    queryKey: ["user_push_notifications", userId, currentPage, perPage, sortParam, orderParam],
    queryFn: () =>
      pushNotificationsApi.getAll({
        user_id: userId,
        page: currentPage,
        limit: perPage,
        sort: sortParam,
        order: orderParam,
      }),
    enabled: !!userId,
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Push notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <PushTable
              items={listQuery.data?.data ?? []}
              isLoading={listQuery.isLoading}
              isError={listQuery.isError}
              hasFilters={false}
              sort={sort}
              order={order}
              onSort={onSort}
              onRetry={() => listQuery.refetch()}
              onSelect={setSelected}
            />
            <PaginationControls
              currentPage={currentPage}
              totalPages={listQuery.data?.meta?.totalPages || 1}
              onPageChange={setCurrentPage}
              perPage={perPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setCurrentPage(1);
              }}
              isLoading={listQuery.isLoading}
            />
          </DataTableShell>
        </CardContent>
      </Card>
      <PushDetailDialog notification={selected} onClose={() => setSelected(null)} />
    </>
  );
}
