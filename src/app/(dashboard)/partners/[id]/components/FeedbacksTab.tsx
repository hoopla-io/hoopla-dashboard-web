import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { partnersApi } from "@/lib/api/domains/partners";

interface FeedbacksTabProps {
  partnerId: number;
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

export function FeedbacksTab({ partnerId }: FeedbacksTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: feedbacksData, isLoading } = useQuery({
    queryKey: ["partner_feedbacks", partnerId],
    queryFn: () => partnersApi.getFeedbacks(partnerId),
    enabled: !!partnerId,
  });

  const feedbacks = useMemo(
    () => (Array.isArray(feedbacksData) ? feedbacksData : []),
    [feedbacksData]
  );

  // No pagination params on the feedbacks endpoint today, so paginate the
  // fetched array client-side.
  const totalPages = Math.max(1, Math.ceil(feedbacks.length / perPage));

  const paginatedFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return feedbacks.slice(start, start + perPage);
  }, [feedbacks, currentPage, perPage]);

  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : null;

  return (
    <div className="space-y-4">
      {averageRating !== null && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Average rating:</span>
          <StarRating rating={Math.round(averageRating)} />
          <span className="text-sm text-muted-foreground">({averageRating.toFixed(1)} from {feedbacks.length} reviews)</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customer Feedbacks</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">Loading feedbacks...</TableCell>
                  </TableRow>
                ) : paginatedFeedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        title="No feedbacks yet"
                        description="Customer feedback for this partner's orders will appear here."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFeedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="font-medium">#{feedback.id}</TableCell>
                      <TableCell>#{feedback.order_id}</TableCell>
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
                        {feedback.created_at ? new Date(feedback.created_at).toLocaleString() : "-"}
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
    </div>
  );
}
