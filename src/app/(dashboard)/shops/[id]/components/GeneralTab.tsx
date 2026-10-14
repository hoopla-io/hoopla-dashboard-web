import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shopsApi } from "@/lib/api/domains/shops";
import { partnersApi } from "@/lib/api/domains/partners";
import type { CreateShopRequest } from "@/lib/api/schemas/shops";

interface GeneralTabProps {
  shopId: number;
}

export function GeneralTab({ shopId }: GeneralTabProps) {
  const queryClient = useQueryClient();
  
  const { data: shop } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => shopsApi.getById(shopId),
    enabled: !!shopId,
  });

  const { data: partnersData } = useQuery({
    queryKey: ["partners-list"],
    queryFn: () => partnersApi.getAll({ page: 1, limit: 100 }),
  });
  
  const partners = partnersData?.data || [];
  
  // Ensure selected partner is in the list
  const allPartners = [...partners];
  if (shop?.partner && !allPartners.find(p => p.id === shop.partner?.id)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allPartners.push(shop.partner as any);
  }

  const [formData, setFormData] = useState<CreateShopRequest>({
    partner_id: 0,
    name: "",
    location_lat: 0,
    location_long: 0,
    vendor_terminal_id: "",
    vendor_login: "",
    vendor_password: "",
    vendor_organization_id: "",
    tin_type: undefined,
    tin_num: "",
    tin_percent: 0,
    status: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [showVendorPassword, setShowVendorPassword] = useState(false);

  useEffect(() => {
    if (shop) {
      // eslint-disable-next-line
      setFormData(prev => ({
        ...prev,
        partner_id: shop.partner?.id || 0,
        name: shop.name,
        location_lat: shop.location_lat || shop.location?.lat || 0,
        location_long: shop.location_long || shop.location?.lng || 0,
        vendor_terminal_id: shop.vendor_terminal_id || "",
        vendor_login: shop.vendor_login || "",
        vendor_password: "",
        vendor_organization_id: shop.vendor_organization_id || "",
        tin_type: shop.tin_type === "tin" || shop.tin_type === "pinfl" ? shop.tin_type : undefined,
        tin_num: shop.tin_num || "",
        tin_percent: shop.tin_percent ?? 0,
        status: shop.status ?? true,
      }));
    }
  }, [shop]);


  const updateMutation = useMutation({
    mutationFn: ({ data, file }: { data: Partial<CreateShopRequest>; file?: File }) =>
      shopsApi.update(shopId, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Заведение обновлено");
      setSelectedFile(undefined);
      setFormData((prev) => ({ ...prev, vendor_password: "" }));
      setShowVendorPassword(false);
    },
    onError: () => {
      toast.error("Не удалось обновить заведение");
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Укажите название");
      return;
    }
    if (!formData.partner_id) {
      toast.error("Укажите партнёра");
      return;
    }
    if (formData.tin_num?.trim() && !formData.tin_type) {
      toast.error("Укажите тип ИНН, если задан номер ИНН");
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
        <CardTitle>Данные заведения</CardTitle>
        <CardDescription>Обновите информацию и настройки заведения</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Название заведения"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partner">Партнёр</Label>
                <Select
                  key={`partner-select-${formData.partner_id}`}
                  value={formData.partner_id > 0 ? String(formData.partner_id) : ""}
                  onValueChange={(val) => setFormData({ ...formData, partner_id: Number(val) })}
                >
                  <SelectTrigger id="partner">
                    <SelectValue placeholder="Выберите партнёра" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPartners.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_terminal_id">ID терминала вендора</Label>
                <Input
                  id="vendor_terminal_id"
                  value={formData.vendor_terminal_id}
                  onChange={(e) => setFormData({ ...formData, vendor_terminal_id: e.target.value })}
                  placeholder="ID терминала"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_login">Логин вендора</Label>
                <Input
                  id="vendor_login"
                  value={formData.vendor_login || ""}
                  onChange={(e) => setFormData({ ...formData, vendor_login: e.target.value })}
                  placeholder="Логин кассы"
                  maxLength={255}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_password">
                  Пароль вендора (оставьте пустым, чтобы не менять)
                </Label>
                <div className="relative">
                  <Input
                    id="vendor_password"
                    type={showVendorPassword ? "text" : "password"}
                    value={formData.vendor_password || ""}
                    onChange={(e) => setFormData({ ...formData, vendor_password: e.target.value })}
                    placeholder="••••••••"
                    minLength={4}
                    maxLength={255}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowVendorPassword((v) => !v)}
                  >
                    {showVendorPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_organization_id">ID организации вендора</Label>
                <Input
                  id="vendor_organization_id"
                  value={formData.vendor_organization_id || ""}
                  onChange={(e) => setFormData({ ...formData, vendor_organization_id: e.target.value })}
                  placeholder="ID организации"
                  maxLength={255}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>Налоги</Label>
                  <p className="text-xs text-muted-foreground">
                    Оставьте номер ИНН пустым, чтобы в чеках использовался ИНН партнёра
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tin_type">Тип ИНН</Label>
                  <Select
                    value={formData.tin_type ?? ""}
                    onValueChange={(val) => setFormData({ ...formData, tin_type: val as "tin" | "pinfl" })}
                  >
                    <SelectTrigger id="tin_type">
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
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tin_percent">Процент ИНН</Label>
                  <Input
                    id="tin_percent"
                    type="number"
                    step="1"
                    min={0}
                    max={100}
                    value={formData.tin_percent ?? 0}
                    onChange={(e) => setFormData({ ...formData, tin_percent: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

               <div className="flex items-center justify-between space-x-2 py-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Статус</Label>
                  <p className="text-xs text-muted-foreground">
                     {formData.status ? "Активно — заведение видно пользователям" : "Неактивно — заведение скрыто от пользователей"}
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lat">Широта</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.location_lat}
                    onChange={(e) => setFormData({ ...formData, location_lat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long">Долгота</Label>
                  <Input
                    id="long"
                    type="number"
                    step="any"
                    value={formData.location_long}
                    onChange={(e) => setFormData({ ...formData, location_long: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {(shop?.image_url || selectedFile) && (
                <div className="mb-2">
                  <img
                    src={selectedFile ? URL.createObjectURL(selectedFile) : (shop?.image_url || "")}
                    alt="Изображение заведения"
                    className="h-32 w-32 object-cover rounded-md border"
                  />
                </div>
              )}
              <Label htmlFor="file">{shop?.image_url ? "Изменить изображение" : "Загрузить изображение"}</Label>
              <Input
                id="file"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
              />
              {selectedFile && !shop?.image_url && (
                <p className="text-xs text-muted-foreground mt-1">
                  Выбрано: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение…" : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
