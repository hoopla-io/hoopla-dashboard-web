import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { usersApi } from "@/lib/api/domains/users";

interface SessionsTabProps {
  userId: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  ios: "iOS",
  android: "Android",
  web: "Web",
};

export function SessionsTab({ userId }: SessionsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() => setCurrentPage(1));

  const { data, isLoading } = useQuery({
    queryKey: ["user_sessions", userId, currentPage, perPage, sortParam, orderParam],
    queryFn: () =>
      usersApi.getSessions(userId, {
        page: currentPage,
        limit: perPage,
        sort: sortParam,
        order: orderParam,
      }),
    enabled: !!userId,
  });

  const sessions = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <SortableTableHead column="platform" sort={sort} order={order} onSort={onSort}>
                  Platform
                </SortableTableHead>
                <SortableTableHead column="app_version" sort={sort} order={order} onSort={onSort}>
                  App version
                </SortableTableHead>
                <TableHead>IP</TableHead>
                <TableHead>Push</TableHead>
                <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                  Signed in
                </SortableTableHead>
                <SortableTableHead column="last_used_at" sort={sort} order={order} onSort={onSort}>
                  Last used
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">Loading sessions...</TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      title="No active sessions"
                      description="Devices this user is signed in on will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{session.device_name || "Unknown device"}</span>
                        <span
                          className="max-w-64 truncate text-xs text-muted-foreground"
                          title={session.user_agent}
                        >
                          {session.user_agent || session.device_id || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {PLATFORM_LABELS[session.platform] || session.platform || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">{session.app_version || "-"}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                      {session.ip || "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={session.has_push ? "Enabled" : "No token"}
                        tone={session.has_push ? "success" : "neutral"}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(session.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(session.last_used_at).toLocaleString()}
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
            onPerPageChange={(n) => {
              setPerPage(n);
              setCurrentPage(1);
            }}
            isLoading={isLoading}
          />
        </DataTableShell>
      </CardContent>
    </Card>
  );
}
