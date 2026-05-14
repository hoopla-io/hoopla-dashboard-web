
import { Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Image from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notificationsApi } from "@/lib/api/domains/notifications";
import { GeneralTab } from "./components/GeneralTab";
import { TranslationsTab } from "./components/TranslationsTab";

const VALID_TABS = ["general", "translations"];

function NotificationDetailContent() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notificationId = Number(params.id);

  const rawTab = searchParams.get("tab") ?? "general";
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : "general";

  function handleTabChange(tab: string) {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    navigate(`?${newParams.toString()}`, { replace: true, preventScrollReset: true });
  }

  const { data: notification, isLoading } = useQuery({
    queryKey: ["notification", notificationId],
    queryFn: () => notificationsApi.getById(notificationId),
    enabled: !!notificationId,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading notification details...</div>;
  }

  if (!notification) {
    return <div className="p-8 text-center text-destructive">Notification not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/notifications")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          {notification.image_url ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-full border">
              <Image
                src={notification.image_url}
                alt={notification.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{notification.title}</h1>
            <p className="text-sm text-muted-foreground">Manage notification details and translations</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="translations">Translations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab notificationId={notificationId} />
        </TabsContent>

        <TabsContent value="translations">
          <TranslationsTab notificationId={notificationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NotificationDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <NotificationDetailContent />
    </Suspense>
  );
}
