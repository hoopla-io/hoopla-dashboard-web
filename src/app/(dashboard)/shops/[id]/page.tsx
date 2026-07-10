
import { Suspense } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shopsApi } from "@/lib/api/domains/shops";
import { GeneralTab } from "./components/GeneralTab";
import { PicturesTab } from "./components/PicturesTab";
import { HoursTab } from "./components/HoursTab";
import { OrdersTab } from "./components/OrdersTab";
import { StaffTab } from "./components/StaffTab";
import { ErrorBoundary } from "@/components/error-boundary";

const VALID_TABS = ["general", "pictures", "hours", "orders", "staff"];

function ShopDetailContent() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = Number(params.id);

  const rawTab = searchParams.get("tab") ?? "general";
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : "general";

  function handleTabChange(tab: string) {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    navigate(`?${newParams.toString()}`, { replace: true, preventScrollReset: true });
  }

  const { data: shop, isLoading: isLoadingShop } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => shopsApi.getById(shopId),
    enabled: !!shopId,
  });

  if (isLoadingShop) {
    return <div className="p-8 text-center text-muted-foreground">Loading shop details...</div>;
  }

  if (!shop) {
    return <div className="p-8 text-center text-destructive">Shop not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/shops")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          {shop.image_url ? (
            <img src={shop.image_url} alt={shop.name} className="h-12 w-12 rounded-lg object-cover border" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border">
              <span className="text-xs text-muted-foreground">No Img</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{shop.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {shop.partner ? (
                <Link
                  to={`/partners/${shop.partner.id}`}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  {shop.partner.name}
                </Link>
              ) : (
                <span>No Partner</span>
              )}
              {shop.location_lat && shop.location_long && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {shop.location_lat.toFixed(4)}, {shop.location_long.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pictures">Pictures</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab shopId={shopId} />
        </TabsContent>

        <TabsContent value="pictures">
          <PicturesTab shopId={shopId} />
        </TabsContent>

        <TabsContent value="hours">
          <HoursTab shopId={shopId} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab shopId={shopId} />
        </TabsContent>

        <TabsContent value="staff">
          <StaffTab shopId={shopId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ShopDetailPage() {
  return (
    <ErrorBoundary pageName="Shop Detail">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
        <ShopDetailContent />
      </Suspense>
    </ErrorBoundary>
  );
}
