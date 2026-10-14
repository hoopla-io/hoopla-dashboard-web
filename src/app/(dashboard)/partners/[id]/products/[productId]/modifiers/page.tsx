
import { useState, useMemo, Suspense } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { useConfirm } from "@/hooks/use-confirm";
import { drinksApi } from "@/lib/api/domains/drinks";
import { partnersApi } from "@/lib/api/domains/partners";
import { formatUZS } from "@/lib/money";
import { ReorderControls } from "@/app/(dashboard)/partners/[id]/components/ReorderControls";
import type { PaginatedResponse } from "@/lib/api/types";
import type { CreatePartnerDrinkModifierRequest, PartnerDrinkModifier, UpdatePartnerDrinkModifierRequest, ModifierGroup, UpdateModifierGroupRequest } from "@/lib/api/schemas/drinks";

const GROUP_TYPE_SUGGESTIONS = ["sugar", "size", "syrup", "milk"];

const apiErrorMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

type GroupForm = { key: string; name: string; min: number; max: string };

const EMPTY_GROUP_FORM: GroupForm = { key: "", name: "", min: 0, max: "1" };

type ModifierForm = { vendor_addon_name: string; vendor_addon_id: string; vendor_addon_price: number; vendor_group_id: string };

const EMPTY_MODIFIER_FORM: ModifierForm = { vendor_addon_name: "", vendor_addon_id: "", vendor_addon_price: 0, vendor_group_id: "" };

function GroupFormDialog({
  partnerDrinkId,
  group,
  open,
  onClose,
}: {
  partnerDrinkId: number;
  group: ModifierGroup | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GroupForm>(() =>
    group
      ? { key: group.key, name: group.name, min: group.min_select, max: group.max_select == null ? "" : String(group.max_select) }
      : EMPTY_GROUP_FORM
  );

  const saveMutation = useMutation({
    mutationFn: (data: UpdateModifierGroupRequest) =>
      group
        ? drinksApi.editModifierGroup(group.id, data)
        : drinksApi.createModifierGroup({ ...data, partner_drink_id: partnerDrinkId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
      toast.success(group ? "Группа модификаторов обновлена" : "Группа модификаторов создана");
      onClose();
    },
    onError: (e: unknown) => toast.error(apiErrorMessage(e, "Не удалось сохранить группу")),
  });

  const typeChanged = !!group && form.key.trim().toLowerCase() !== group.key;

  const handleSubmit = () => {
    if (!form.key.trim()) {
      toast.error("Укажите тип группы");
      return;
    }
    saveMutation.mutate({
      key: form.key.trim().toLowerCase(),
      name: form.name.trim(),
      min_select: form.min,
      max_select: form.max === "" ? null : Number(form.max),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? "Редактирование группы" : "Новая группа"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group_key">Тип</Label>
            <Input
              id="group_key"
              list="group-type-suggestions"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="напр. size, sugar, topic…"
              autoComplete="off"
            />
            <datalist id="group-type-suggestions">
              {GROUP_TYPE_SUGGESTIONS.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
            {typeChanged && group.option_count > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Новый тип также будет применён к модификаторам этой группы ({group.option_count}).
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="group_name">Отображаемое название</Label>
            <Input
              id="group_name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Видно клиентам — по умолчанию совпадает с типом"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="group_min">Мин.</Label>
              <Input id="group_min" type="number" min={0} value={form.min} onChange={(e) => setForm({ ...form, min: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_max">Макс.</Label>
              <Input id="group_max" type="number" min={0} placeholder="∞" value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })} />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Сколько вариантов клиент обязан (Мин.) и может (Макс., пусто = без ограничений) выбрать.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение…" : "Сохранить группу"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GroupModifiersDialog({
  partnerId,
  partnerDrinkId,
  group,
  onClose,
}: {
  partnerId: number;
  partnerDrinkId: number;
  group: ModifierGroup;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const confirmDelete = useConfirm();

  const [formOpen, setFormOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<PartnerDrinkModifier | null>(null);
  const [form, setForm] = useState<ModifierForm>(EMPTY_MODIFIER_FORM);
  const [draggedModifierId, setDraggedModifierId] = useState<number | null>(null);

  const groupModifiersQueryKey = ["partner_drink_modifiers", partnerDrinkId, "group", group.id];

  const { data: modifiersData, isLoading } = useQuery({
    queryKey: groupModifiersQueryKey,
    queryFn: () => drinksApi.listModifiers(partnerDrinkId, { page: 1, limit: 100, modifier_group_id: group.id }),
  });
  const modifiers = useMemo(() => modifiersData?.data || [], [modifiersData]);

  const { data: productModifiersData } = useQuery({
    queryKey: ["partner_drink_modifiers", partnerDrinkId, "all"],
    queryFn: () => drinksApi.listModifiers(partnerDrinkId, { page: 1, limit: 100 }),
  });
  const productModifiers = useMemo(() => productModifiersData?.data || [], [productModifiersData]);

  const { data: partnerModifiersData, isLoading: isLoadingPartnerModifiers } = useQuery({
    queryKey: ["partner_modifiers", partnerId],
    queryFn: () => partnersApi.getModifiers(partnerId),
    enabled: !!partnerId,
  });

  const nameOptions = useMemo(() => {
    const names = (partnerModifiersData || []).map((m) => m.name);
    if (form.vendor_addon_name && !names.includes(form.vendor_addon_name)) names.unshift(form.vendor_addon_name);
    return names;
  }, [partnerModifiersData, form.vendor_addon_name]);

  const namesInGroup = useMemo(
    () => new Set(modifiers.filter((m) => m.id !== editingModifier?.id).map((m) => (m.vendor_addon_name ?? "").toLowerCase())),
    [modifiers, editingModifier],
  );

  const nextVendorAddonId = useMemo(() => {
    const nums = productModifiers
      .map((m) => parseInt(m.vendor_addon_id ?? "", 10))
      .filter((n) => Number.isFinite(n));
    return String((nums.length ? Math.max(...nums) : 0) + 1);
  }, [productModifiers]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
    queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreatePartnerDrinkModifierRequest) => drinksApi.createModifier(data),
    onSuccess: () => {
      invalidate();
      toast.success("Модификатор создан");
      setForm({ ...EMPTY_MODIFIER_FORM, vendor_group_id: form.vendor_group_id });
    },
    onError: () => toast.error("Не удалось создать модификатор"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePartnerDrinkModifierRequest }) => drinksApi.updateModifier(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Модификатор обновлён");
      setFormOpen(false);
    },
    onError: () => toast.error("Не удалось обновить модификатор"),
  });

  const deleteMutation = useMutation({
    mutationFn: drinksApi.deleteModifier,
    onSuccess: () => {
      invalidate();
      toast.success("Модификатор удалён");
    },
    onError: () => toast.error("Не удалось удалить модификатор"),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedModifiers: PartnerDrinkModifier[]) =>
      drinksApi.reorderModifiers({
        modifier_group_id: group.id,
        modifier_ids: orderedModifiers.map((modifier) => modifier.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
    },
  });

  const moveModifier = (fromIndex: number, toIndex: number) => {
    if (
      reorderMutation.isPending ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= modifiers.length ||
      toIndex >= modifiers.length
    ) return;

    const reordered = [...modifiers];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    queryClient.setQueryData<PaginatedResponse<PartnerDrinkModifier>>(
      groupModifiersQueryKey,
      (current) => current && { ...current, data: reordered }
    );

    reorderMutation.mutate(reordered, {
      onError: () => {
        queryClient.setQueryData(groupModifiersQueryKey, modifiersData);
        queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
        toast.error("Не удалось сохранить порядок модификаторов");
      },
    });
  };

  const ownVendorGroupId = (mod?: PartnerDrinkModifier) =>
    mod?.vendor_group_id && mod.vendor_group_id !== group.key ? mod.vendor_group_id : "";

  const openAddForm = () => {
    setEditingModifier(null);
    setForm({ ...EMPTY_MODIFIER_FORM, vendor_group_id: ownVendorGroupId(modifiers[0]) });
    setFormOpen(true);
  };

  const openEditForm = (mod: PartnerDrinkModifier) => {
    setEditingModifier(mod);
    setForm({
      vendor_addon_name: mod.vendor_addon_name ?? "",
      vendor_addon_id: mod.vendor_addon_id ?? "",
      vendor_addon_price: mod.vendor_addon_price ?? 0,
      vendor_group_id: ownVendorGroupId(mod),
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.vendor_addon_name || !form.vendor_addon_id) {
      toast.error("Укажите модификатор и ID модификатора у вендора");
      return;
    }
    if (productModifiers.some((m) => m.id !== editingModifier?.id && (m.vendor_addon_id ?? "") === form.vendor_addon_id)) {
      toast.error(`ID модификатора у вендора «${form.vendor_addon_id}» уже используется в этом товаре. У каждого варианта должен быть уникальный ID.`);
      return;
    }
    if (editingModifier) {
      const { vendor_group_id, ...rest } = form;
      const vendorGroupChanged = vendor_group_id !== ownVendorGroupId(editingModifier);
      updateMutation.mutate({
        id: editingModifier.id,
        data: { ...rest, vendor_addon_key: group.key, ...(vendorGroupChanged ? { vendor_group_id } : {}) },
      });
      return;
    }
    createMutation.mutate({ ...form, partner_drink_id: partnerDrinkId, modifier_group_id: group.id, vendor_addon_key: group.key });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Модификаторы группы «{group.name || group.key || "Группа"}»</DialogTitle>
            <DialogDescription>
              Тип <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">{group.key || "—"}</span> · выбор: мин. {group.min_select}, макс. {group.max_select ?? "∞"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={openAddForm}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить модификатор
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"><span className="sr-only">Порядок</span></TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>ID модификатора у вендора</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Загрузка…</TableCell></TableRow>
                  ) : modifiers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="p-0">
                      <EmptyState title="В этой группе нет модификаторов" description="Добавьте модификатор, чтобы начать." />
                    </TableCell></TableRow>
                  ) : (
                    modifiers.map((mod, index) => (
                      <TableRow
                        key={mod.id}
                        onDragOver={(event) => {
                          if (draggedModifierId !== null && !reorderMutation.isPending) event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          moveModifier(modifiers.findIndex((modifier) => modifier.id === draggedModifierId), index);
                          setDraggedModifierId(null);
                        }}
                        className={draggedModifierId === mod.id ? "opacity-50" : undefined}
                      >
                        <TableCell className="px-2">
                          <ReorderControls
                            label={mod.vendor_addon_name || "модификатор"}
                            disabled={reorderMutation.isPending}
                            canMoveUp={index > 0}
                            canMoveDown={index < modifiers.length - 1}
                            onMoveUp={() => moveModifier(index, index - 1)}
                            onMoveDown={() => moveModifier(index, index + 1)}
                            onDragStart={() => setDraggedModifierId(mod.id)}
                            onDragEnd={() => setDraggedModifierId(null)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{mod.vendor_addon_name}</TableCell>
                        <TableCell>{mod.vendor_addon_id}</TableCell>
                        <TableCell>{formatUZS(mod.vendor_addon_price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditForm(mod)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deleteMutation.isPending}
                              onClick={async () => { if (await confirmDelete({ title: "Удалить модификатор?" })) deleteMutation.mutate(mod.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </DataTableShell>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModifier ? "Редактирование модификатора" : "Новый модификатор"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modifier_name">Модификатор</Label>
              <Select value={form.vendor_addon_name} onValueChange={(value) => setForm({ ...form, vendor_addon_name: value })}>
                <SelectTrigger id="modifier_name" className="w-full">
                  <SelectValue placeholder={isLoadingPartnerModifiers ? "Загрузка…" : "Выберите модификатор"} />
                </SelectTrigger>
                <SelectContent>
                  {nameOptions.map((name) => (
                    <SelectItem key={name} value={name} disabled={namesInGroup.has(name.toLowerCase())}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Нет нужного? Сначала добавьте его на вкладке{" "}
                <Link to={`/partners/${partnerId}?tab=modifiers`} className="underline underline-offset-2">
                  «Модификаторы»
                </Link>{" "}
                партнёра.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modifier_vendor_id">ID модификатора у вендора</Label>
              <Input
                id="modifier_vendor_id"
                value={form.vendor_addon_id}
                onChange={(e) => setForm({ ...form, vendor_addon_id: e.target.value })}
                placeholder={`Уникален в пределах товара — напр. ${nextVendorAddonId}`}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="modifier_price">Цена</Label>
                <Input
                  id="modifier_price"
                  type="number"
                  value={form.vendor_addon_price}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, vendor_addon_price: val === "" ? 0 : parseFloat(val) });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modifier_vendor_group_id">ID группы у вендора (необязательно)</Label>
                <Input
                  id="modifier_vendor_group_id"
                  value={form.vendor_group_id}
                  onChange={(e) => setForm({ ...form, vendor_group_id: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {editingModifier ? "Отмена" : "Закрыть"}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Сохранение…" : editingModifier ? "Сохранить изменения" : "Сохранить модификатор"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ModifiersContent() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const confirmDelete = useConfirm();

  const partnerId = Number(params.id);
  const partnerDrinkId = Number(params.productId);
  const drinkName = searchParams.get("productName") || searchParams.get("drinkName") || "Товар";

  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [openGroupId, setOpenGroupId] = useState<number | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<number | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["modifier_groups", partnerDrinkId],
    queryFn: () => drinksApi.listModifierGroups(partnerDrinkId),
    enabled: !!partnerDrinkId,
  });
  const openGroup = groups.find((group) => group.id === openGroupId);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => drinksApi.deleteModifierGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
      toast.success("Группа модификаторов удалена");
    },
    onError: (e: unknown) => toast.error(apiErrorMessage(e, "Не удалось удалить группу")),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedGroups: ModifierGroup[]) =>
      drinksApi.reorderModifierGroups({
        partner_drink_id: partnerDrinkId,
        modifier_group_ids: orderedGroups.map((group) => group.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
    },
  });

  const moveGroup = (fromIndex: number, toIndex: number) => {
    if (
      reorderMutation.isPending ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= groups.length ||
      toIndex >= groups.length
    ) return;

    const reordered = [...groups];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    queryClient.setQueryData<ModifierGroup[]>(["modifier_groups", partnerDrinkId], reordered);

    reorderMutation.mutate(reordered, {
      onError: () => {
        queryClient.setQueryData<ModifierGroup[]>(["modifier_groups", partnerDrinkId], groups);
        queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
        toast.error("Не удалось сохранить порядок групп");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/partners/${partnerId}?tab=products`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Добавки: {drinkName}</h1>
          <p className="text-sm text-muted-foreground">Управление группами модификаторов товара. Нажмите на группу, чтобы управлять её модификаторами.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setEditingGroup(null); setGroupFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить группу
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Группы модификаторов</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><span className="sr-only">Порядок</span></TableHead>
                  <TableHead>Отображаемое название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="w-[90px]">Мин.</TableHead>
                  <TableHead className="w-[90px]">Макс.</TableHead>
                  <TableHead className="w-[100px]">Модификаторы</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Загрузка…</TableCell></TableRow>
                ) : groups.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="p-0">
                    <EmptyState title="Группы модификаторов не найдены" description="Добавьте группу, чтобы начать." />
                  </TableCell></TableRow>
                ) : (
                  groups.map((g, index) => (
                    <TableRow
                      key={g.id}
                      onClick={() => setOpenGroupId(g.id)}
                      onDragOver={(event) => {
                        if (draggedGroupId !== null && !reorderMutation.isPending) event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        moveGroup(groups.findIndex((group) => group.id === draggedGroupId), index);
                        setDraggedGroupId(null);
                      }}
                      className={`cursor-pointer ${draggedGroupId === g.id ? "opacity-50" : ""}`}
                    >
                      <TableCell className="px-2" onClick={(event) => event.stopPropagation()}>
                        <ReorderControls
                          label={g.name || g.key}
                          disabled={reorderMutation.isPending}
                          canMoveUp={index > 0}
                          canMoveDown={index < groups.length - 1}
                          onMoveUp={() => moveGroup(index, index - 1)}
                          onMoveDown={() => moveGroup(index, index + 1)}
                          onDragStart={() => setDraggedGroupId(g.id)}
                          onDragEnd={() => setDraggedGroupId(null)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{g.name || g.key}</TableCell>
                      <TableCell>
                        {g.key ? (
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px]">{g.key}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">{g.min_select}</TableCell>
                      <TableCell className="tabular-nums">{g.max_select ?? "∞"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">{g.option_count}</TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingGroup(g); setGroupFormOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deleteMutation.isPending}
                            onClick={async () => {
                              const confirmed = await confirmDelete({
                                title: "Удалить группу модификаторов?",
                                description: `Группа «${g.name || g.key}» и её модификаторы (${g.option_count}) будут удалены из этого товара.`,
                              });
                              if (confirmed) deleteMutation.mutate(g.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTableShell>
        </CardContent>
      </Card>

      {groupFormOpen ? (
        <GroupFormDialog
          key={editingGroup?.id ?? "new"}
          partnerDrinkId={partnerDrinkId}
          group={editingGroup}
          open
          onClose={() => setGroupFormOpen(false)}
        />
      ) : null}

      {openGroup ? (
        <GroupModifiersDialog
          key={openGroup.id}
          partnerId={partnerId}
          partnerDrinkId={partnerDrinkId}
          group={openGroup}
          onClose={() => setOpenGroupId(null)}
        />
      ) : null}
    </div>
  );
}

export default function ProductModifiersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка модификаторов…</div>}>
      <ModifiersContent />
    </Suspense>
  );
}
