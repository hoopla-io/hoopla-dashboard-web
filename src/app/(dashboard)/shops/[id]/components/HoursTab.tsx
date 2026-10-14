import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { useConfirm } from "@/hooks/use-confirm";
import { shopsApi } from "@/lib/api/domains/shops";
import type { CreateShopHoursRequest } from "@/lib/api/schemas/shops";

interface HoursTabProps {
  shopId: number;
}

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Понедельник",
  tuesday: "Вторник",
  wednesday: "Среда",
  thursday: "Четверг",
  friday: "Пятница",
  saturday: "Суббота",
  sunday: "Воскресенье",
};

export function HoursTab({ shopId }: HoursTabProps) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<CreateShopHoursRequest, "shop_id">>({
    week_day: "",
    open_at: "",
    close_at: "",
  });

  const { data: hours, isLoading } = useQuery({
    queryKey: ["shop-hours", shopId],
    queryFn: () => shopsApi.getHours(shopId),
    enabled: !!shopId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateShopHoursRequest) => shopsApi.createHours(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-hours", shopId] });
      toast.success("Часы работы добавлены");
      setIsAddOpen(false);
      setFormData({ week_day: "", open_at: "", close_at: "" });
    },
    onError: () => toast.error("Не удалось добавить часы работы"),
  });

  const confirmDelete = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shopsApi.deleteHours(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-hours", shopId] });
      toast.success("Часы работы удалены");
    },
    onError: () => toast.error("Не удалось удалить часы работы"),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.week_day || !formData.open_at || !formData.close_at) {
      toast.error("Заполните все поля");
      return;
    }
    createMutation.mutate({ ...formData, shop_id: shopId });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Часы работы</CardTitle>
            <CardDescription>Управление недельным расписанием заведения</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Добавить часы
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Добавить часы работы</DialogTitle>
                  <DialogDescription>
                    Укажите время открытия и закрытия для выбранного дня.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>День недели</Label>
                    <Select
                      value={formData.week_day}
                      onValueChange={(val) => setFormData({ ...formData, week_day: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите день" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((day) => (
                          <SelectItem key={day} value={day}>
                            {WEEKDAY_LABELS[day]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="open_at">Открывается в</Label>
                      <Input
                        id="open_at"
                        type="time"
                        value={formData.open_at}
                        onChange={(e) => setFormData({ ...formData, open_at: e.target.value })}
                        placeholder="23:59"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="close_at">Закрывается в</Label>
                      <Input
                        id="close_at"
                        type="time"
                        value={formData.close_at}
                        onChange={(e) => setFormData({ ...formData, close_at: e.target.value })}
                        placeholder="23:59"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Добавление…" : "Добавить часы"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>День</TableHead>
                  <TableHead>Открытие</TableHead>
                  <TableHead>Закрытие</TableHead>
                  <TableHead className="w-[100px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      Загрузка…
                    </TableCell>
                  </TableRow>
                ) : !hours || hours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState
                        title="Часы работы не заданы"
                        description="Добавьте время открытия и закрытия для каждого дня недели."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  [...hours].sort((a,b) => WEEKDAYS.indexOf(a.week_day) - WEEKDAYS.indexOf(b.week_day)).map((hour) => (
                    <TableRow key={hour.id}>
                      <TableCell className="font-medium capitalize">{WEEKDAY_LABELS[hour.week_day] ?? hour.week_day}</TableCell>
                      <TableCell>{hour.open_at}</TableCell>
                      <TableCell>{hour.close_at}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={async () => { if (await confirmDelete({ title: `Удалить часы работы: ${WEEKDAY_LABELS[hour.week_day] ?? hour.week_day}?` })) deleteMutation.mutate(hour.id); }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTableShell>
        </CardContent>
      </Card>
    </div>
  );
}
