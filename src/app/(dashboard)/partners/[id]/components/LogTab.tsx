import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { eventsApi } from "@/lib/api/domains/events";
import type { ShopEvent } from "@/lib/api/schemas/events";

interface LogTabProps {
  partnerId: number;
}

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "shop.login", label: "Shop login" },
  { value: "shop.login_failed", label: "Shop login failed" },
  { value: "staff.login", label: "Staff login" },
  { value: "staff.login_failed", label: "Staff login failed" },
  { value: "staff.logout", label: "Staff logout" },
  { value: "cassa.online", label: "Cassa online" },
  { value: "cassa.offline", label: "Cassa offline" },
  { value: "order.received", label: "Order received" },
  { value: "order.accepted", label: "Order accepted" },
  { value: "order.completed", label: "Order completed" },
  { value: "order.cancelled", label: "Order cancelled" },
];

const EVENT_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map((type) => [type.value, type.label]),
);

function eventBadgeVariant(eventType: string): "default" | "destructive" | "secondary" {
  if (eventType === "order.completed" || eventType === "cassa.online") return "default";
  if (eventType === "order.cancelled" || eventType === "cassa.offline" || eventType.endsWith("_failed")) {
    return "destructive";
  }
  return "secondary";
}

function formatDetails(details: ShopEvent["details"]): string {
  if (!details) return "—";
  if (typeof details.reason === "string") return details.reason;
  return JSON.stringify(details);
}

export function LogTab({ partnerId }: LogTabProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [typeFilter, setTypeFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["partner-events", partnerId, page, perPage, typeFilter, from, to],
    queryFn: () =>
      eventsApi.getByPartner(partnerId, {
        page,
        limit: perPage,
        types: typeFilter !== "all" ? typeFilter : undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    enabled: !!partnerId,
  });

  const events = eventsData?.data || [];
  const totalPages = eventsData?.meta?.totalPages || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <Select
            value={typeFilter}
            onValueChange={(value: string) => {
              setTypeFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="md:w-[170px]"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="md:w-[170px]"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event: ShopEvent) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={eventBadgeVariant(event.event_type)}>
                        {EVENT_LABELS[event.event_type] ?? event.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.shop.name}</TableCell>
                    <TableCell>{event.user?.name ?? "—"}</TableCell>
                    <TableCell>{event.order_id !== null ? `#${event.order_id}` : "—"}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                      {formatDetails(event.details)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
