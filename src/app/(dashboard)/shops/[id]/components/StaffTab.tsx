import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/hooks/use-confirm";
import { partnerUsersApi } from "@/lib/api/domains/partner-users";
import { shopsApi } from "@/lib/api/domains/shops";
import {
  PARTNER_USER_ROLES,
  type PartnerUser,
  type PartnerUserRole,
} from "@/lib/api/schemas/partner-users";

interface StaffTabProps {
  shopId: number;
}

type RoleFilter = "ALL" | PartnerUserRole;

interface StaffFormState {
  name: string;
  role: PartnerUserRole;
  vendor_pin: string;
  phone_number: string;
  password: string;
}

const EMPTY_FORM: StaffFormState = {
  name: "",
  role: "CASHIER",
  vendor_pin: "",
  phone_number: "",
  password: "",
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  MANAGER: "secondary",
  CASHIER: "outline",
  KIOSK: "default",
};

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Менеджер",
  CASHIER: "Кассир",
  KIOSK: "Киоск",
};

const isShopRole = (role: string): role is PartnerUserRole =>
  (PARTNER_USER_ROLES as readonly string[]).includes(role);

const PAGE_SIZE = 500;

export function StaffTab({ shopId }: StaffTabProps) {
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerUser | null>(null);
  const [form, setForm] = useState<StaffFormState>(EMPTY_FORM);

  const { data: shop } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => shopsApi.getById(shopId),
    enabled: !!shopId,
  });

  const partnerId = shop?.partner?.id;

  const { data: staffData, isLoading, error } = useQuery({
    // Scope to the shop's partner so a shop's cashiers don't fall off page 1
    // once platform-wide partner_users exceed the 100-row cap.
    queryKey: ["partner-users", "shop", shopId, partnerId],
    queryFn: () => partnerUsersApi.getAll({ page: 1, limit: PAGE_SIZE, partner_id: partnerId }),
    enabled: !!shopId && !!partnerId,
  });

  const allStaff = useMemo(() => staffData?.data ?? [], [staffData]);
  const shopStaff = useMemo(
    () => allStaff.filter((u) => u.shop_id === shopId || u.shop?.id === shopId),
    [allStaff, shopId]
  );

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shopStaff.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (q) {
        const name = (u.name ?? "").toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [shopStaff, roleFilter, search]);

  const createMutation = useMutation({
    mutationFn: partnerUsersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-users"] });
      toast.success("Сотрудник добавлен");
      closeDialog();
    },
    onError: () => toast.error("Не удалось добавить сотрудника"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & Parameters<typeof partnerUsersApi.update>[1]) =>
      partnerUsersApi.update(id, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-users"] });
      toast.success("Сотрудник обновлён");
      closeDialog();
    },
    onError: () => toast.error("Не удалось обновить сотрудника"),
  });

  const confirmDelete = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: partnerUsersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-users"] });
      toast.success("Сотрудник удалён");
    },
    onError: () => toast.error("Не удалось удалить сотрудника"),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  }

  function openEdit(user: PartnerUser) {
    setEditing(user);
    setForm({
      name: user.name ?? "",
      role: isShopRole(user.role) ? user.role : "CASHIER",
      vendor_pin: "",
      phone_number: user.phone_number ?? "",
      password: "",
    });
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!partnerId) {
      return toast.error("У заведения нет партнёра — нельзя добавить сотрудника");
    }

    const name = form.name.trim();

    if (form.role === "KIOSK") {
      const phoneNumber = form.phone_number.replace(/\D/g, "");
      const password = form.password.trim();
      if (phoneNumber.length < 9) {
        return toast.error("Введите номер телефона киоска");
      }
      if ((!editing || password) && password.length < 6) {
        return toast.error("Пароль должен содержать не менее 6 символов");
      }

      const kiosk = {
        partner_id: partnerId,
        shop_id: shopId,
        name: name || undefined,
        role: form.role,
        phone_number: phoneNumber,
        password: password || undefined,
      };

      return editing ? updateMutation.mutate({ id: editing.id, ...kiosk }) : createMutation.mutate(kiosk);
    }

    const vendorPin = form.vendor_pin.trim();
    if (vendorPin && !/^\d{4}$/.test(vendorPin)) {
      return toast.error("PIN-код должен состоять ровно из 4 цифр");
    }

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        partner_id: partnerId,
        shop_id: shopId,
        name: name || undefined,
        role: form.role,
        vendor_pin: vendorPin || undefined,
      });
    } else {
      createMutation.mutate({
        partner_id: partnerId,
        shop_id: shopId,
        name: name || undefined,
        role: form.role,
        vendor_pin: vendorPin || undefined,
      });
    }
  }

  async function handleDelete(user: PartnerUser) {
    if (!(await confirmDelete({ title: `Удалить ${user.name ?? `#${user.id}`}?` }))) return;
    deleteMutation.mutate(user.id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Поиск по имени"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-64"
          />
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="md:w-40">
              <SelectValue placeholder="Роль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все роли</SelectItem>
              {PARTNER_USER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} disabled={!partnerId}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить сотрудника
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Сотрудники</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead className="w-[100px] text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                      Загрузка сотрудников…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-destructive">
                      Не удалось загрузить сотрудников
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="p-0">
                      <EmptyState
                        title="Нет сотрудников"
                        description="Здесь появятся сотрудники этого заведения."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANTS[user.role] ?? "outline"}>{ROLE_LABELS[user.role] ?? user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(user)}
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Редактировать сотрудника" : "Добавить сотрудника"}</DialogTitle>
              <DialogDescription>
                {form.role === "KIOSK"
                  ? editing
                    ? "Обновите аккаунт киоска. Оставьте пароль пустым, чтобы сохранить текущий."
                    : `Аккаунт киоска привязан к заведению «${shop?.name ?? "это заведение"}» и входит на kiosk.hoopla.uz по номеру телефона и паролю.`
                  : editing
                    ? "Обновите данные сотрудника. Оставьте PIN-код пустым, чтобы сохранить текущий."
                    : `Кассир будет привязан к заведению «${shop?.name ?? "это заведение"}» и будет входить по 4-значному PIN-коду.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shop-staff-name">Имя</Label>
                <Input
                  id="shop-staff-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Полное имя (необязательно)"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-staff-role">Роль</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as PartnerUserRole })}
                >
                  <SelectTrigger id="shop-staff-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_USER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r] ?? r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.role === "KIOSK" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="shop-kiosk-phone">Номер телефона</Label>
                    <Input
                      id="shop-kiosk-phone"
                      value={form.phone_number}
                      onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/[^\d+]/g, "") })}
                      placeholder="998901234567"
                      inputMode="tel"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop-kiosk-password">Пароль</Label>
                    <Input
                      id="shop-kiosk-password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={editing ? "Оставьте пустым, чтобы не менять" : "Не менее 6 символов"}
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Сотрудники один раз вводят номер телефона и пароль на iPad киоска на kiosk.hoopla.uz.
                    </p>
                  </div>
                </>
              )}

              {(form.role === "CASHIER" || form.role === "MANAGER") && (
                <div className="space-y-2">
                  <Label htmlFor="shop-staff-pin">PIN-код кассы (4 цифры)</Label>
                  <Input
                    id="shop-staff-pin"
                    value={form.vendor_pin}
                    onChange={(e) =>
                      setForm({ ...form, vendor_pin: e.target.value.replace(/\D/g, "").slice(0, 4) })
                    }
                    placeholder={editing ? "Оставьте пустым, чтобы не менять" : "например, 1234"}
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Кассир вводит его после выбора себя на cassa.hoopla.uz.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Сохранение…" : editing ? "Сохранить изменения" : "Добавить сотрудника"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
