import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { usersApi } from "@/lib/api/domains/users";
import { formatUZS } from "@/lib/money";

interface TransactionsTabProps {
  userId: number;
}

const TYPES = ["system", "payme", "click"];

export function TransactionsTab({ userId }: TransactionsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() => setCurrentPage(1));

  const { data, isLoading } = useQuery({
    queryKey: ["user_transactions", userId, currentPage, perPage, typeFilter, paymentFilter, sortParam, orderParam],
    queryFn: () =>
      usersApi.getTransactions(userId, {
        page: currentPage,
        limit: perPage,
        transaction_type: typeFilter === "all" ? undefined : typeFilter,
        payment_type: paymentFilter === "all" ? undefined : paymentFilter,
        sort: sortParam,
        order: orderParam,
      }),
    enabled: !!userId,
  });

  const transactions = data?.data.transactions || [];
  const totals = data?.data.totals;
  const totalPages = data?.meta?.totalPages || 1;
  const hasFilters = typeFilter !== "all" || paymentFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="w-44">
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44">
            <Select
              value={paymentFilter}
              onValueChange={(v) => {
                setPaymentFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">In and out</SelectItem>
                <SelectItem value="debit">Money in</SelectItem>
                <SelectItem value="credit">Money out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {totals ? (
          <p className="text-sm text-muted-foreground">
            In: <span className="font-medium text-foreground">{formatUZS(totals.debit)} сум</span> · Out:{" "}
            <span className="font-medium text-foreground">{formatUZS(totals.credit)} сум</span>
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" sort={sort} order={order} onSort={onSort}>
                    ID
                  </SortableTableHead>
                  <SortableTableHead column="transaction_type" sort={sort} order={order} onSort={onSort}>
                    Type
                  </SortableTableHead>
                  <SortableTableHead column="payment_type" sort={sort} order={order} onSort={onSort}>
                    Direction
                  </SortableTableHead>
                  <SortableTableHead column="amount" sort={sort} order={order} onSort={onSort}>
                    Amount
                  </SortableTableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                    Date
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">Loading transactions...</TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        title="No transactions found"
                        description={
                          hasFilters
                            ? "Try clearing your filters."
                            : "Top-ups, cashback and refunds of this user will appear here."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => {
                    const isDebit = transaction.payment_type === "debit";
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">#{transaction.id}</TableCell>
                        <TableCell className="text-sm capitalize">{transaction.transaction_type}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={isDebit ? "In" : "Out"}
                            tone={isDebit ? "success" : "danger"}
                          />
                        </TableCell>
                        <TableCell className="font-mono tabular-nums">
                          {isDebit ? "+" : "−"}
                          {formatUZS(transaction.amount)} сум
                        </TableCell>
                        <TableCell className="max-w-xs text-sm">{transaction.description || "-"}</TableCell>
                        <TableCell className="max-w-40 truncate font-mono text-xs text-muted-foreground">
                          {transaction.transaction_id || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
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
    </div>
  );
}
