import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { partnersApi } from "@/lib/api/domains/partners";
import type { CreatePartnerRequest } from "@/lib/api/schemas/partners";

interface GeneralTabProps {
  partnerId: number;
}

export function GeneralTab({ partnerId }: GeneralTabProps) {
  const queryClient = useQueryClient();
  const { data: partner } = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => partnersApi.getById(partnerId),
    enabled: !!partnerId,
  });

  const [formData, setFormData] = useState<CreatePartnerRequest>({
    name: "",
    description: "",
    vendor: undefined,
    vendor_key: "",
    tin_type: undefined,
    tin_num: "",
    tin_percent: 0,
    cashback_percent: 0,
    commission_percent: 10,
    status: true,
    type: "normal",
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    if (partner) {
      // eslint-disable-next-line
      setFormData({
        name: partner.name,
        description: partner.description || "",
        // @ts-expect-error: vendor property may be null or undefined
        vendor: partner.vendor || undefined,
        vendor_key: partner.vendor_key || "",
        // @ts-expect-error: tin_type property may be null or undefined
        tin_type: partner.tin_type || undefined,
        tin_num: partner.tin_num || "",
        tin_percent: partner.tin_percent || 0,
        cashback_percent: partner.cashback_percent || 0,
        commission_percent: partner.commission_percent ?? 10,
        status: partner.status ?? true,
        type: partner.type ?? "normal",
      });
    }
  }, [partner]);

  const updateMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreatePartnerRequest; file?: File }) =>
      partnersApi.update(partnerId, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Партнёр обновлён!");
    },
    onError: () => {
      toast.error("Не удалось обновить партнёра");
    },
  });

  const handleUpdate = () => {
    if (!formData.name) {
      toast.error("Укажите название");
      return;
    }
    updateMutation.mutate({ data: formData, file: selectedFile });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Допускаются только файлы JPG и PNG");
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Данные партнёра</CardTitle>
        <CardDescription>Обновите информацию и настройки партнёра</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Внешний вид и текст</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Логотип</Label>
              <Input
                id="file"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
              />
              {partner?.image_url && !selectedFile && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Текущий логотип:</p>
                  <img src={partner.image_url} alt="Текущий логотип" className="h-16 w-16 object-cover rounded-md border" />
                </div>
              )}
              {selectedFile && <p className="text-xs text-muted-foreground">Выбрано: {selectedFile.name}</p>}
              <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Статус</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.status ? "Активен — партнёр активен" : "Неактивен — партнёр неактивен"}
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                />
              </div>
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="type">Тип</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: "normal" | "test") => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Обычный</SelectItem>
                    <SelectItem value="test">Тестовый</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Тестовые партнёры (и их заведения) скрыты от реальных клиентов — видны только с заголовком X-Hoopla-Test.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Настройки вендора</h3>
            <div className="space-y-2">
              <Label htmlFor="vendor">Вендор</Label>
              <Select
                value={formData.vendor}
                // @ts-expect-error: Select onValueChange expects strict string type
                onValueChange={(val) => setFormData({ ...formData, vendor: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите вендора" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iiko">Iiko</SelectItem>
                  <SelectItem value="poster">Poster</SelectItem>
                  <SelectItem value="deliveryhub">DeliveryHub</SelectItem>
                  <SelectItem value="loyverse">Loyverse</SelectItem>
                  <SelectItem value="hoopla">Hoopla (собственная касса)</SelectItem>
                </SelectContent>
              </Select>
              {formData.vendor === "hoopla" && (
                <p className="text-xs text-muted-foreground">
                  Кассиры этого партнёра управляются на вкладке «Сотрудники».
                </p>
              )}
            </div>
            {formData.vendor !== "hoopla" && (
              <div className="space-y-2">
                <Label htmlFor="vendor_key">Ключ вендора</Label>
                <Input
                  id="vendor_key"
                  value={formData.vendor_key || ""}
                  onChange={(e) => setFormData({ ...formData, vendor_key: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Налоги и финансы</h3>
            <div className="space-y-2">
              <Label htmlFor="tin_type">Тип ИНН</Label>
              <Select
                value={formData.tin_type}
                // @ts-expect-error: Select onValueChange expects strict string type
                onValueChange={(val) => setFormData({ ...formData, tin_type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tin">ИНН</SelectItem>
                  <SelectItem value="pinfl">ПИНФЛ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tin_num">Номер ИНН</Label>
              <Input
                id="tin_num"
                value={formData.tin_num || ""}
                onChange={(e) => setFormData({ ...formData, tin_num: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tin_percent">Процент ИНН</Label>
              <Input
                id="tin_percent"
                type="number"
                step="0.01"
                value={formData.tin_percent || 0}
                onChange={(e) => setFormData({ ...formData, tin_percent: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashback_percent">Процент кэшбэка</Label>
              <Input
                id="cashback_percent"
                type="number"
                step="0.01"
                value={formData.cashback_percent || 0}
                onChange={(e) => setFormData({ ...formData, cashback_percent: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_percent">Процент комиссии</Label>
              <Input
                id="commission_percent"
                type="number"
                step="0.01"
                value={formData.commission_percent || 0}
                onChange={(e) => setFormData({ ...formData, commission_percent: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                % от каждого заказа, который Hoopla удерживает во взаиморасчётах после первых 3 месяцев работы партнёра (по умолчанию 10%).
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Сохранение…" : "Сохранить изменения"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
