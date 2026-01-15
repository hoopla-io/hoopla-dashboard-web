"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { partnersApi } from "@/lib/api/domains/partners";
import { GeneralTab } from "./components/GeneralTab";
import { ShopsTab } from "./components/ShopsTab";
import { DrinksTab } from "./components/DrinksTab";
import { OrdersTab } from "./components/OrdersTab";
import { AttributesTab } from "./components/AttributesTab";

function PartnerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const partnerId = Number(params.id);

  const [activeTab, setActiveTab] = useState("general");

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/partners")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          {partner.logoUrl && (
            <img src={partner.logoUrl} alt={partner.name} className="h-12 w-12 rounded-full object-cover border" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{partner.name}</h1>
            <p className="text-sm text-muted-foreground">Manage partner details and settings</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shops">Shops</TabsTrigger>
          <TabsTrigger value="drinks">Drinks</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="shops">
          <ShopsTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="drinks">
          <DrinksTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab partnerId={partnerId} />
        </TabsContent>

        <TabsContent value="attributes">
          <AttributesTab partnerId={partnerId} />
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
