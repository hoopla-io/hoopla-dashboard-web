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

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
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
      toast.success("User updated");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update user")),
  });

  const { stats } = user;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Balance" value={formatUZS(user.balance, { suffix: "сум" })} />
        <StatCard
          label="Total spent"
          value={formatSomUZS(stats.total_spent, { suffix: "сум" })}
          hint={`${stats.completed_orders} completed orders`}
        />
        <StatCard
          label="Orders"
          value={String(stats.orders_count)}
          hint={`${stats.cancelled_orders} cancelled`}
        />
        <StatCard
          label="Last order"
          value={stats.last_order_at ? new Date(stats.last_order_at).toLocaleDateString() : "—"}
        />
        <StatCard label="Cashback earned" value={formatUZS(stats.cashback_earned, { suffix: "сум" })} />
        <StatCard label="Cashback used" value={formatUZS(stats.cashback_used, { suffix: "сум" })} />
        <StatCard
          label="Average rating"
          value={stats.feedbacks_count > 0 ? stats.average_rating.toFixed(1) : "—"}
          hint={`${stats.feedbacks_count} feedbacks`}
        />
        <StatCard label="Active sessions" value={String(stats.sessions_count)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
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
                <Label>Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="User name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={formData.phone_number || ""}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(v) => setFormData({ ...formData, gender: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mobile provider</Label>
                <Input
                  value={formData.mobile_provider || ""}
                  onChange={(e) => setFormData({ ...formData, mobile_provider: e.target.value })}
                  placeholder="Mobile provider"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Birth date</Label>
                <Input
                  value={formData.birthday || ""}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Registered</Label>
                <Input value={new Date(user.created_at).toLocaleString()} disabled />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
