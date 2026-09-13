import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import {
  formatPushKind,
  formatPushReference,
  formatPushStatus,
  pushStatusTone,
} from "@/lib/push-notification";
import type { PushNotification } from "@/lib/api/schemas/push-notifications";
import type { SortOrder } from "@/lib/api/types";

const COLUMNS = 7;

type PushTableProps = {
  items: PushNotification[];
  isLoading: boolean;
  isError: boolean;
  hasFilters: boolean;
  sort: string;
  order: SortOrder;
  onSort: (column: string) => void;
  onRetry: () => void;
  onSelect: (notification: PushNotification) => void;
};

export function PushTable({
  items,
  isLoading,
  isError,
  hasFilters,
  sort,
  order,
  onSort,
  onRetry,
  onSelect,
}: PushTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
            Time
          </SortableTableHead>
          <TableHead>User</TableHead>
          <SortableTableHead column="kind" sort={sort} order={order} onSort={onSort}>
            Kind
          </SortableTableHead>
          <TableHead>Message</TableHead>
          <SortableTableHead column="reference_id" sort={sort} order={order} onSort={onSort}>
            Reference
          </SortableTableHead>
          <SortableTableHead column="attempt" sort={sort} order={order} onSort={onSort}>
            Attempt
          </SortableTableHead>
          <SortableTableHead column="status" sort={sort} order={order} onSort={onSort}>
            Status
          </SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={COLUMNS} className="py-10 text-center text-sm text-muted-foreground">
              Loading…
            </TableCell>
          </TableRow>
        ) : isError ? (
          <TableRow>
            <TableCell colSpan={COLUMNS} className="py-10 text-center">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Couldn't load push notifications.</p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMNS} className="p-0">
              <EmptyState
                title="No push notifications found"
                description={
                  hasFilters
                    ? "Try adjusting or clearing your filters."
                    : "Pushes sent by the customer API will appear here."
                }
              />
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id} className="cursor-pointer" onClick={() => onSelect(item)}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm text-foreground">
                    {item.user ? item.user.name || "—" : `Deleted user #${item.user_id}`}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {item.user?.phone_number}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{formatPushKind(item.kind)}</Badge>
              </TableCell>
              <TableCell>
                <div className="max-w-[360px]">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.body}</p>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">
                {formatPushReference(item.kind, item.reference_id)}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums">{item.attempt}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge label={formatPushStatus(item.status)} tone={pushStatusTone(item.status)} />
                  {item.error ? (
                    <span className="max-w-[200px] truncate text-xs text-destructive" title={item.error}>
                      {item.error}
                    </span>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
