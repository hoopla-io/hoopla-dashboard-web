import { Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { ordersApi } from "@/lib/api/domains/orders";
import { getApiErrorMessage } from "@/lib/api/error";
import { useOrdersFilters } from "@/app/(dashboard)/orders/hooks/useOrdersFilters";
import { OrdersFilters } from "@/app/(dashboard)/orders/components/OrdersFilters";
import { OrdersListTab } from "@/app/(dashboard)/orders/components/OrdersListTab";
import { OrdersAnalyticsTab } from "@/app/(dashboard)/orders/components/OrdersAnalyticsTab";

const VIEWS = ["list", "analytics"] as const;

function OrdersContent() {
  const filters = useOrdersFilters();
  const [view, setView] = useQueryState("view", parseAsStringLiteral(VIEWS).withDefault("list"));

  const exportMutation = useMutation({
    mutationFn: () => ordersApi.exportExcel(filters.listParams),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to export orders")),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track orders and how they perform across partners and shops."
        action={
          view === "list" ? (
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              <Download className="size-4" />
              {exportMutation.isPending ? "Exporting…" : "Export Excel"}
            </Button>
          ) : undefined
        }
      />

      <Tabs
        value={view}
        onValueChange={(v) => setView(v === "list" ? null : (v as (typeof VIEWS)[number]))}
        className="space-y-2"
      >
        <TabsList>
          <TabsTrigger value="list">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <OrdersFilters filters={filters} showListFilters={view === "list"} />

        <TabsContent value="list">
          <OrdersListTab filters={filters} />
        </TabsContent>
        <TabsContent value="analytics">
          <OrdersAnalyticsTab params={filters.analyticsParams} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ErrorBoundary pageName="Orders">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading orders…
          </div>
        }
      >
        <OrdersContent />
      </Suspense>
    </ErrorBoundary>
  );
}
