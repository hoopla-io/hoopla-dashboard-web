import { Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { usersApi } from "@/lib/api/domains/users";
import { GeneralTab } from "@/app/(dashboard)/users/[id]/components/GeneralTab";
import { OrdersTab } from "@/app/(dashboard)/users/[id]/components/OrdersTab";
import { TransactionsTab } from "@/app/(dashboard)/users/[id]/components/TransactionsTab";
import { SessionsTab } from "@/app/(dashboard)/users/[id]/components/SessionsTab";
import { FeedbacksTab } from "@/app/(dashboard)/users/[id]/components/FeedbacksTab";
import { PromocodesTab } from "@/app/(dashboard)/users/[id]/components/PromocodesTab";
import { NotificationsTab } from "@/app/(dashboard)/users/[id]/components/NotificationsTab";

const VALID_TABS = ["general", "orders", "transactions", "sessions", "feedbacks", "promocodes", "notifications"];

function UserDetailContent() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = Number(params.id);

  const requestedTab = searchParams.get("tab") ?? "general";
  const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : "general";

  function handleTabChange(tab: string) {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    navigate(`?${newParams.toString()}`, { replace: true, preventScrollReset: true });
  }

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.getById(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Загрузка пользователя…</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-destructive">Пользователь не найден</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name || user.phone_number}
        description="Профиль, заказы, операции по кошельку и устройства пользователя."
      />

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/users")}>
          <ArrowLeft className="size-4" />
          Назад
        </Button>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          #{user.user_id} · {user.phone_number}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
          <TabsTrigger value="sessions">Сессии</TabsTrigger>
          <TabsTrigger value="feedbacks">Отзывы</TabsTrigger>
          <TabsTrigger value="promocodes">Промокоды</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab user={user} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab userId={userId} />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionsTab userId={userId} />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTab userId={userId} />
        </TabsContent>

        <TabsContent value="feedbacks">
          <FeedbacksTab userId={userId} />
        </TabsContent>

        <TabsContent value="promocodes">
          <PromocodesTab userId={userId} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function UserDetailPage() {
  return (
    <ErrorBoundary pageName="Пользователь">
      <Suspense fallback={<div className="p-8 text-center">Загрузка…</div>}>
        <UserDetailContent />
      </Suspense>
    </ErrorBoundary>
  );
}
