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

const TYPE_LABELS: Record<string, string> = {
  system: "Система",
  payme: "Payme",
  click: "Click",
};

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
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TYPE_LABELS[type] ?? type}
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
                <SelectValue placeholder="Направление" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Приход и расход</SelectItem>
                <SelectItem value="debit">Приход</SelectItem>
                <SelectItem value="credit">Расход</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {totals ? (
          <p className="text-sm text-muted-foreground">
            Приход: <span className="font-medium text-foreground">{formatUZS(totals.debit)} сум</span> · Расход:{" "}
            <span className="font-medium text-foreground">{formatUZS(totals.credit)} сум</span>
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История транзакций</CardTitle>
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
                    Тип
                  </SortableTableHead>
                  <SortableTableHead column="payment_type" sort={sort} order={order} onSort={onSort}>
                    Направление
                  </SortableTableHead>
                  <SortableTableHead column="amount" sort={sort} order={order} onSort={onSort}>
                    Сумма
                  </SortableTableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Референс</TableHead>
                  <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                    Дата
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">Загрузка транзакций…</TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        title="Транзакции не найдены"
                        description={
                          hasFilters
                            ? "Попробуйте сбросить фильтры."
                            : "Здесь появятся пополнения, кэшбэк и возвраты этого пользователя."
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
                        <TableCell className="text-sm capitalize">{TYPE_LABELS[transaction.transaction_type] ?? transaction.transaction_type}</TableCell>
                        <TableCell>
                          <StatusBadge
                            label={isDebit ? "Приход" : "Расход"}
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
                          {transaction.created_at ? new Date(transaction.created_at).toLocaleString("ru-RU") : "-"}
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
