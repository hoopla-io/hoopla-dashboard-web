import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CalendarIcon, X, Layers, Download } from "lucide-react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { format } from "date-fns";

import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { SearchableSelect } from "@/components/pickers/searchable-select";
import { AccountPicker } from "@/components/pickers/account-picker";
import { promocodesApi } from "@/lib/api/domains/promocodes";
import { partnersApi } from "@/lib/api/domains/partners";
import type { Promocode, CreatePromocodeRequest } from "@/lib/api/schemas/promocodes";

function dateToIso(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

function isoToApi(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getTimeFromIso(iso: string): string {
  if (!iso) return "00:00";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "00:00";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setTimeOnIso(iso: string, time: string): string {
  const d = iso ? new Date(iso) : new Date();
  const [hh, mm] = time.split(":").map(Number);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.toISOString();
}

// "" -> undefined, else Number; keeps optional numeric fields clean.
function numOrUndef(v: string): number | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function downloadFile(filename: string, content: Blob | string) {
  const blob = typeof content === "string" ? new Blob([content], { type: "text/csv" }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const defaultForm: CreatePromocodeRequest = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  min_order_amount: 0,
  per_user_limit: 1,
  is_active: true,
  starts_at: "",
  expires_at: "",
};

function DateTimePicker({
  value, onChange, onClear,
}: {
  value: string;
  onChange: (iso: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;
  const hasValue = !!value && !isNaN(new Date(value).getTime());

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !hasValue && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {hasValue ? format(date!, "dd/MM/yyyy") : "Выберите дату"}
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                className="ml-auto"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClear(); } }}
              >
                <X className="h-4 w-4 opacity-50 hover:opacity-100" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                const prev = value ? new Date(value) : new Date();
                d.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                onChange(d.toISOString());
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {hasValue && (
        <Input
          type="time"
          value={getTimeFromIso(value)}
          onChange={(e) => onChange(setTimeOnIso(value, e.target.value))}
        />
      )}
    </div>
  );
}

function PromocodesContent() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const [codeFilter, setCodeFilter] = useQueryState("code", parseAsString.withDefault(""));
  const [activeFilter, setActiveFilter] = useQueryState("active", parseAsString.withDefault(""));
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() =>
    setCurrentPage(1)
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkLength, setBulkLength] = useState(8);
  const [exporting, setExporting] = useState(false);
  const [editPromocode, setEditPromocode] = useState<Promocode | null>(null);
  const [formData, setFormData] = useState<CreatePromocodeRequest>(defaultForm);

  const { data: promocodesData, isLoading } = useQuery({
    queryKey: ["promocodes", currentPage, perPage, codeFilter, activeFilter, sortParam, orderParam],
    queryFn: () => promocodesApi.getAll({
      page: currentPage,
      limit: perPage,
      code: codeFilter || undefined,
      is_active: activeFilter === "" ? undefined : activeFilter === "true",
      sort: sortParam,
      order: orderParam,
    }),
  });

  const promocodes = promocodesData?.data || [];
  const totalPages = promocodesData?.meta?.totalPages || 1;

  const { data: partnersData } = useQuery({
    queryKey: ["partners-all"],
    queryFn: () => partnersApi.getAll({ limit: 100 }),
  });
  const partners = partnersData?.data || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["promocodes"] });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromocodeRequest) => promocodesApi.create(data),
    onSuccess: () => {
      invalidate();
      toast.success("Промокод создан");
      setIsCreateOpen(false);
      setFormData(defaultForm);
    },
    onError: (err: unknown) => toast.error(extractError(err, "Не удалось создать промокод")),
  });

  const bulkMutation = useMutation({
    mutationFn: () => {
      const { code: _code, ...settings } = buildPayload();
      void _code;
      return promocodesApi.bulkCreate({
        ...settings,
        count: bulkCount,
        code_prefix: bulkPrefix.trim() || undefined,
        code_length: bulkLength,
      });
    },
    onSuccess: (res) => {
      invalidate();
      toast.success(`Создано промокодов: ${res.count}`);
      // Download the generated codes so they can be distributed.
      const csv = "code\n" + res.codes.join("\n") + "\n";
      downloadFile(`promocodes-${res.count}.csv`, csv);
      setIsBulkOpen(false);
    },
    onError: (err: unknown) => toast.error(extractError(err, "Не удалось создать промокоды")),
  });

  async function handleExportCsv() {
    try {
      setExporting(true);
      const blob = await promocodesApi.exportCsv({
        code: codeFilter || undefined,
        is_active: activeFilter === "" ? undefined : activeFilter === "true",
      });
      downloadFile("promocodes.csv", blob);
    } catch {
      toast.error("Не удалось экспортировать промокоды");
    } finally {
      setExporting(false);
    }
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePromocodeRequest> }) =>
      promocodesApi.update(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Промокод обновлён");
      setEditPromocode(null);
    },
    onError: (err: unknown) => toast.error(extractError(err, "Не удалось обновить промокод")),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      promocodesApi.update(id, { is_active }),
    onSuccess: () => {
      invalidate();
      toast.success("Статус промокода обновлён");
    },
    onError: () => toast.error("Не удалось обновить статус"),
  });

  const confirmDelete = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: promocodesApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Промокод удалён");
    },
    onError: () => toast.error("Не удалось удалить промокод"),
  });

  function buildPayload(): CreatePromocodeRequest {
    const payload = { ...formData };
    payload.code = payload.code.trim();
    if (payload.starts_at) payload.starts_at = isoToApi(payload.starts_at);
    if (payload.expires_at) payload.expires_at = isoToApi(payload.expires_at);
    if (!payload.description) delete payload.description;
    return payload;
  }

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(buildPayload());
  }

  function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPromocode) return;
    updateMutation.mutate({ id: editPromocode.id, data: buildPayload() });
  }

  function openEdit(promocode: Promocode) {
    setEditPromocode(promocode);
    setFormData({
      code: promocode.code,
      description: promocode.description || "",
      discount_type: promocode.discount_type,
      discount_value: promocode.discount_value,
      max_discount_percent: promocode.max_discount_percent ?? undefined,
      max_discount_amount: promocode.max_discount_amount ?? undefined,
      min_order_amount: promocode.min_order_amount,
      usage_limit: promocode.usage_limit ?? undefined,
      per_user_limit: promocode.per_user_limit,
      partner_id: promocode.partner_id ?? undefined,
      user_id: promocode.user_id ?? undefined,
      is_active: promocode.is_active,
      starts_at: dateToIso(promocode.starts_at),
      expires_at: dateToIso(promocode.expires_at),
    });
  }

  const isPercent = formData.discount_type === "percent";

  const formFields = (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Код</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="SUMMER25"
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <Switch
            checked={formData.is_active ?? true}
            onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
          />
          <Label>Активен</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Описание (необязательно)</Label>
        <Input
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Летняя акция, скидка 25%"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Тип скидки</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(v) => setFormData({ ...formData, discount_type: v as "amount" | "percent" })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Процент (%)</SelectItem>
              <SelectItem value="amount">Фиксированная сумма (сум)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{isPercent ? "Процент (0-100)" : "Сумма (сум)"}</Label>
          <Input
            type="number"
            value={formData.discount_value ?? ""}
            onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Макс. % от заказа (необязательно)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            placeholder="напр. 25, 50, 100"
            value={formData.max_discount_percent ?? ""}
            onChange={(e) => setFormData({ ...formData, max_discount_percent: numOrUndef(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Макс. сумма скидки (необязательно)</Label>
          <Input
            type="number"
            placeholder="лимит в сумах"
            value={formData.max_discount_amount ?? ""}
            onChange={(e) => setFormData({ ...formData, max_discount_amount: numOrUndef(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Мин. заказ (сум)</Label>
          <Input
            type="number"
            value={formData.min_order_amount ?? 0}
            onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Всего использований (необязательно)</Label>
          <Input
            type="number"
            placeholder="без ограничений"
            value={formData.usage_limit ?? ""}
            onChange={(e) => setFormData({ ...formData, usage_limit: numOrUndef(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Использований на пользователя</Label>
          <Input
            type="number"
            value={formData.per_user_limit ?? 1}
            onChange={(e) => setFormData({ ...formData, per_user_limit: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Партнёр (необязательно — только для одного партнёра)</Label>
        <SearchableSelect
          value={formData.partner_id ? String(formData.partner_id) : "all"}
          onValueChange={(v) => setFormData({ ...formData, partner_id: v === "all" ? undefined : Number(v) })}
          placeholder="Все партнёры"
          searchPlaceholder="Поиск партнёров…"
          items={[
            { value: "all", label: "Все партнёры" },
            ...partners.map((p) => ({ value: String(p.id), label: p.name })),
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Конкретный аккаунт (необязательно — только для одного пользователя)</Label>
        <AccountPicker
          value={formData.user_id}
          onChange={(id) => setFormData({ ...formData, user_id: id })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Дата начала (необязательно)</Label>
          <DateTimePicker
            value={formData.starts_at || ""}
            onChange={(v) => setFormData({ ...formData, starts_at: v })}
            onClear={() => setFormData({ ...formData, starts_at: "" })}
          />
        </div>
        <div className="space-y-2">
          <Label>Дата окончания (необязательно)</Label>
          <DateTimePicker
            value={formData.expires_at || ""}
            onChange={(v) => setFormData({ ...formData, expires_at: v })}
            onClear={() => setFormData({ ...formData, expires_at: "" })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Промокоды"
        description="Создание и управление кодами скидок, которые клиенты применяют при оформлении заказа."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCsv} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Экспорт…" : "Экспорт CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFormData(defaultForm);
                setIsBulkOpen(true);
              }}
            >
              <Layers className="size-4" />
              Массовое создание
            </Button>
            <Button
              onClick={() => {
                setFormData(defaultForm);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="size-4" />
              Добавить промокод
            </Button>
          </div>
        }
      />

      <PageToolbar>
        <Input
          placeholder="Поиск по коду…"
          className="w-[220px]"
          value={codeFilter}
          onChange={(e) => {
            setCodeFilter(e.target.value || null);
            setCurrentPage(1);
          }}
        />
        <Select
          value={activeFilter || "all"}
          onValueChange={(v) => {
            setActiveFilter(v === "all" ? null : v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="true">Активные</SelectItem>
            <SelectItem value="false">Неактивные</SelectItem>
          </SelectContent>
        </Select>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead className="w-[64px]" column="id" sort={sort} order={order} onSort={onSort}>
                ID
              </SortableTableHead>
              <SortableTableHead column="code" sort={sort} order={order} onSort={onSort}>
                Код
              </SortableTableHead>
              <TableHead>Скидка</TableHead>
              <TableHead>Лимиты</TableHead>
              <SortableTableHead column="min_order_amount" sort={sort} order={order} onSort={onSort}>
                Мин. заказ
              </SortableTableHead>
              <SortableTableHead column="used_count" sort={sort} order={order} onSort={onSort}>
                Использования
              </SortableTableHead>
              <SortableTableHead column="is_active" sort={sort} order={order} onSort={onSort}>
                Активен
              </SortableTableHead>
              <TableHead>Период</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : promocodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    title="Промокодов пока нет"
                    description="Здесь появятся коды скидок, которые клиенты применяют при оформлении заказа."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(defaultForm);
                          setIsCreateOpen(true);
                        }}
                      >
                        <Plus className="size-4" />
                        Добавить промокод
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              promocodes.map((promocode) => (
                <TableRow key={promocode.id}>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{promocode.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm font-medium text-foreground">{promocode.code}</span>
                      {promocode.description && (
                        <span className="max-w-[200px] truncate text-[11px] text-muted-foreground">
                          {promocode.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {promocode.discount_type === "percent"
                      ? `${promocode.discount_value}%`
                      : `${promocode.discount_value.toLocaleString("ru-RU")} сум`}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {promocode.max_discount_percent != null && <span>≤{promocode.max_discount_percent}% </span>}
                    {promocode.max_discount_amount != null && (
                      <span>≤{promocode.max_discount_amount.toLocaleString("ru-RU")}</span>
                    )}
                    {promocode.max_discount_percent == null && promocode.max_discount_amount == null && "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {promocode.min_order_amount > 0 ? promocode.min_order_amount.toLocaleString("ru-RU") : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {promocode.used_count}
                    {promocode.usage_limit != null ? `/${promocode.usage_limit}` : ""}
                    <span className="px-1 text-muted-foreground/60">·</span>
                    {promocode.per_user_limit}/польз.
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={promocode.is_active}
                      onCheckedChange={(v) => toggleActiveMutation.mutate({ id: promocode.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {promocode.starts_at ? new Date(promocode.starts_at).toLocaleDateString("ru-RU") : "—"}
                    </span>
                    <span className="px-1">→</span>
                    <span className="font-mono tabular-nums">
                      {promocode.expires_at ? new Date(promocode.expires_at).toLocaleDateString("ru-RU") : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(promocode)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => { if (await confirmDelete({ title: "Удалить промокод?" })) deleteMutation.mutate(promocode.id); }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={(v) => {
            setPerPage(v);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </DataTableShell>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Массовое создание промокодов</DialogTitle>
            <DialogDescription>
              Сгенерируйте много одноразовых кодов с общими настройками ниже. Коды скачаются в CSV.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); bulkMutation.mutate(); }}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input type="number" min={1} max={1000} value={bulkCount}
                    onChange={(e) => setBulkCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Префикс кода</Label>
                  <Input value={bulkPrefix} placeholder="SUMMER-"
                    onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label>Длина случайной части</Label>
                  <Input type="number" min={4} max={24} value={bulkLength}
                    onChange={(e) => setBulkLength(Number(e.target.value))} />
                </div>
              </div>
              <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Коды генерируются автоматически, напр. <span className="font-mono text-foreground">{(bulkPrefix || "") + "AB7KMN2P"}</span>.
                Поле <b>Код</b> ниже игнорируется — используются только настройки скидки.
              </p>
              {formFields}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBulkOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={bulkMutation.isPending}>
                {bulkMutation.isPending ? "Генерация…" : `Сгенерировать ${bulkCount} и скачать CSV`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать промокод</DialogTitle>
            <DialogDescription>Добавьте новый код скидки</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Создание…" : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPromocode} onOpenChange={(open) => { if (!open) setEditPromocode(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать промокод</DialogTitle>
            <DialogDescription>Измените настройки промокода</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditPromocode(null)}>Отмена</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Сохранение…" : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function extractError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

export default function PromocodesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка промокодов…</div>}>
      <PromocodesContent />
    </Suspense>
  );
}
