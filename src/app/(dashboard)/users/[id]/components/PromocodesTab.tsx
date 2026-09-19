import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usersApi } from "@/lib/api/domains/users";
import { formatSomUZS } from "@/lib/money";

interface PromocodesTabProps {
  userId: number;
}

export function PromocodesTab({ userId }: PromocodesTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["user_promocodes", userId, currentPage, perPage],
    queryFn: () => usersApi.getPromocodes(userId, { page: currentPage, limit: perPage }),
    enabled: !!userId,
  });

  const redemptions = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promo code usage</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading promo codes...</TableCell>
                </TableRow>
              ) : redemptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="No promo codes used"
                      description="Promo codes this user redeems on orders will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell className="font-medium">#{redemption.id}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {redemption.code || `#${redemption.promocode_id}`}
                    </TableCell>
                    <TableCell>#{redemption.order_id}</TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {formatSomUZS(redemption.discount_amount)} сум
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {redemption.created_at ? new Date(redemption.created_at).toLocaleString() : "-"}
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
