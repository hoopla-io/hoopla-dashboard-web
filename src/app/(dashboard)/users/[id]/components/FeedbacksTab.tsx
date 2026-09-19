import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { usersApi } from "@/lib/api/domains/users";

interface FeedbacksTabProps {
  userId: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating}</span>
    </div>
  );
}

export function FeedbacksTab({ userId }: FeedbacksTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() => setCurrentPage(1));

  const { data, isLoading } = useQuery({
    queryKey: ["user_feedbacks", userId, currentPage, perPage, sortParam, orderParam],
    queryFn: () =>
      usersApi.getFeedbacks(userId, {
        page: currentPage,
        limit: perPage,
        sort: sortParam,
        order: orderParam,
      }),
    enabled: !!userId,
  });

  const feedbacks = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedbacks</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" sort={sort} order={order} onSort={onSort}>
                  ID
                </SortableTableHead>
                <SortableTableHead column="order_id" sort={sort} order={order} onSort={onSort}>
                  Order
                </SortableTableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Shop</TableHead>
                <SortableTableHead column="rating" sort={sort} order={order} onSort={onSort}>
                  Rating
                </SortableTableHead>
                <TableHead>Comment</TableHead>
                <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                  Date
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">Loading feedbacks...</TableCell>
                </TableRow>
              ) : feedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      title="No feedbacks yet"
                      description="Ratings this user leaves on orders will appear here."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="font-medium">#{feedback.id}</TableCell>
                    <TableCell>#{feedback.order_id}</TableCell>
                    <TableCell>
                      <Link
                        to={`/partners/${feedback.partner_id}`}
                        className="text-foreground underline-offset-2 hover:underline"
                      >
                        {feedback.partner || `#${feedback.partner_id}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/shops/${feedback.shop_id}`}
                        className="text-foreground underline-offset-2 hover:underline"
                      >
                        {feedback.shop || `#${feedback.shop_id}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={feedback.rating} />
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {feedback.comment ? (
                        <span className="text-sm">{feedback.comment}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(feedback.created_at).toLocaleString()}
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
