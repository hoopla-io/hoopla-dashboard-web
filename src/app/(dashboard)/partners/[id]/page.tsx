
import { Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffTab } from "@/app/(dashboard)/partners/[id]/components/StaffTab";
import { SettlementsTab } from "@/app/(dashboard)/partners/[id]/components/SettlementsTab";
import { PageHeader } from "@/components/layout/page-header";
import { partnersApi } from "@/lib/api/domains/partners";
import { GeneralTab } from "@/app/(dashboard)/partners/[id]/components/GeneralTab";
import { ShopsTab } from "@/app/(dashboard)/partners/[id]/components/ShopsTab";
import { DrinksTab } from "@/app/(dashboard)/partners/[id]/components/DrinksTab";
import { OrdersTab } from "@/app/(dashboard)/partners/[id]/components/OrdersTab";
import { AttributesTab } from "@/app/(dashboard)/partners/[id]/components/AttributesTab";
import { FeedbacksTab } from "@/app/(dashboard)/partners/[id]/components/FeedbacksTab";
import { CategoriesTab } from "@/app/(dashboard)/partners/[id]/components/CategoriesTab";
import { AnalyticsTab } from "@/app/(dashboard)/partners/[id]/components/AnalyticsTab";

const VALID_TABS = ["general", "shops", "products", "orders", "analytics", "attributes", "feedbacks", "categories", "staff", "settlements"];

function PartnerDetailContent() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const partnerId = Number(params.id);

  const requestedTab = searchParams.get("tab") ?? "general";
  const rawTab = requestedTab === "drinks" ? "products" : requestedTab;
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : "general";

  function handleTabChange(tab: string) {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    navigate(`?${newParams.toString()}`, { replace: true, preventScrollReset: true });
  }

  const { data: partner, isLoading: isLoadingPartner } = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => partnersApi.getById(partnerId),
    enabled: !!partnerId,
  });

  if (isLoadingPartner) {
    return <div className="p-8 text-center text-muted-foreground">Loading partner details...</div>;
  }

  if (!partner) {
    return <div className="p-8 text-center text-destructive">Partner not found</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={partner.name} description="Manage partner details and settings." />

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/partners")}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {partner.image_url ? (
          <img
            src={partner.image_url}
            alt={partner.name}
            className="size-9 rounded-full object-cover ring-1 ring-border"
          />
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shops">Shops</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="shops">
          <ShopsTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="products">
          <DrinksTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="attributes">
          <AttributesTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="feedbacks">
          <FeedbacksTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab partnerId={partnerId} />
        </TabsContent>
        <TabsContent value="staff">
          <StaffTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="settlements">
          <SettlementsTab partnerId={partnerId} />
        </TabsContent>

      </Tabs>
    </div>
  );
}

export default function PartnerDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <PartnerDetailContent />
    </Suspense>
  );
}
