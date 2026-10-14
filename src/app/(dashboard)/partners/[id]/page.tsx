
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
import { ProductsTab } from "@/app/(dashboard)/partners/[id]/components/ProductsTab";
import { OrdersTab } from "@/app/(dashboard)/partners/[id]/components/OrdersTab";
import { AttributesTab } from "@/app/(dashboard)/partners/[id]/components/AttributesTab";
import { ModifiersTab } from "@/app/(dashboard)/partners/[id]/components/ModifiersTab";
import { FeedbacksTab } from "@/app/(dashboard)/partners/[id]/components/FeedbacksTab";
import { CategoriesTab } from "@/app/(dashboard)/partners/[id]/components/CategoriesTab";
import { AnalyticsTab } from "@/app/(dashboard)/partners/[id]/components/AnalyticsTab";

const VALID_TABS = ["general", "shops", "products", "modifiers", "orders", "analytics", "attributes", "feedbacks", "categories", "staff", "settlements"];

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
    return <div className="p-8 text-center text-muted-foreground">Загрузка данных партнёра…</div>;
  }

  if (!partner) {
    return <div className="p-8 text-center text-destructive">Партнёр не найден</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={partner.name} description="Управление данными и настройками партнёра." />

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/partners")}>
          <ArrowLeft className="size-4" />
          Назад
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
          <TabsTrigger value="general">Общее</TabsTrigger>
          <TabsTrigger value="shops">Заведения</TabsTrigger>
          <TabsTrigger value="products">Товары</TabsTrigger>
          <TabsTrigger value="modifiers">Модификаторы</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="attributes">Атрибуты</TabsTrigger>
          <TabsTrigger value="feedbacks">Отзывы</TabsTrigger>
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="staff">Сотрудники</TabsTrigger>
          <TabsTrigger value="settlements">Взаиморасчёты</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="shops">
          <ShopsTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="modifiers">
          <ModifiersTab partnerId={partnerId} />
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
    <Suspense fallback={<div className="p-8 text-center">Загрузка…</div>}>
      <PartnerDetailContent />
    </Suspense>
  );
}
