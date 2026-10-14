import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi } from "@/lib/api/domains/users";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatSomUZS, formatUZS } from "@/lib/money";
import type { EditUserRequest, UserDetail } from "@/lib/api/schemas/users";

interface GeneralTabProps {
  user: UserDetail;
}

interface StatCell {
  label: string;
  value: string;
  hint?: string;
}

export function GeneralTab({ user }: GeneralTabProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EditUserRequest>({
    name: user.name,
    phone_number: user.phone_number,
    gender: user.gender,
    mobile_provider: user.mobile_provider,
    birthday: user.date_of_birth,
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditUserRequest) => usersApi.update(user.user_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", user.user_id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Пользователь обновлён");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось обновить пользователя")),
  });

  const { stats } = user;

  const cells: StatCell[] = [
    { label: "Баланс", value: formatUZS(user.balance, { suffix: "сум" }) },
    {
      label: "Всего потрачено",
      value: formatSomUZS(stats.total_spent, { suffix: "сум" }),
      hint: `Завершённых заказов: ${stats.completed_orders}`,
    },
    { label: "Заказы", value: String(stats.orders_count), hint: `Отменено: ${stats.cancelled_orders}` },
    {
      label: "Последний заказ",
      value: stats.last_order_at ? new Date(stats.last_order_at).toLocaleDateString("ru-RU") : "—",
    },
    { label: "Кэшбэк начислен", value: formatUZS(stats.cashback_earned, { suffix: "сум" }) },
    { label: "Кэшбэк использован", value: formatUZS(stats.cashback_used, { suffix: "сум" }) },
    {
      label: "Средняя оценка",
      value: stats.feedbacks_count > 0 ? stats.average_rating.toFixed(1) : "—",
      hint: `Отзывов: ${stats.feedbacks_count}`,
    },
    { label: "Активные сессии", value: String(stats.sessions_count) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="flex flex-col gap-1 bg-card px-4 py-3">
            <span className="text-xs text-muted-foreground">{cell.label}</span>
            <span className="font-mono text-xl tabular-nums text-foreground">{cell.value}</span>
            {cell.hint ? <span className="text-xs text-muted-foreground">{cell.hint}</span> : null}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(formData);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Имя</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Имя пользователя"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Телефон</Label>
                <Input
                  value={formData.phone_number || ""}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Номер телефона"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Пол</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(v) => setFormData({ ...formData, gender: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Пол" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="female">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Мобильный оператор</Label>
                <Input
                  value={formData.mobile_provider || ""}
                  onChange={(e) => setFormData({ ...formData, mobile_provider: e.target.value })}
                  placeholder="Мобильный оператор"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Дата рождения</Label>
                <Input
                  value={formData.birthday || ""}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  placeholder="ГГГГ-ММ-ДД"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Дата регистрации</Label>
                <Input value={new Date(user.created_at).toLocaleString("ru-RU")} disabled />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение…" : "Сохранить изменения"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
