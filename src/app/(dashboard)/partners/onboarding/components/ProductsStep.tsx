import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Coffee, Loader2, Plus, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/pickers/searchable-select";
import { OfdSpicInput } from "@/components/pickers/ofd-spic-input";
import { drinksApi } from "@/lib/api/domains/drinks";
import { CreateDrinkSchema } from "@/lib/api/schemas/drinks";
import type { DrinkCategory } from "@/lib/api/schemas/drinks";

const DrinkDetailsSchema = z.object({
  vendor_product_name: z.string().optional(),
  product_price: z.number().optional(),
  vendor_product_price: z.number().optional(),
});
type DrinkDetailsValues = z.infer<typeof DrinkDetailsSchema>;
type NewDrinkValues = z.infer<typeof CreateDrinkSchema>;

interface AddedDrink {
  id: number;
  label: string;
}

interface ProductsStepProps {
  partnerId: number;
  categories: DrinkCategory[];
  drinks: AddedDrink[];
  onAdd: (drink: AddedDrink) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ProductsStep({ partnerId, categories, drinks, onAdd, onContinue, onBack }: ProductsStepProps) {
  const queryClient = useQueryClient();
  const [selectedDrinkId, setSelectedDrinkId] = useState("");
  const [pendingDrinkName, setPendingDrinkName] = useState<string | undefined>(undefined);
  const [showNewDrinkForm, setShowNewDrinkForm] = useState(false);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | undefined>(undefined);

  const { data: catalogData } = useQuery({
    queryKey: ["drinks", "onboarding-picker"],
    queryFn: () => drinksApi.getAll({ limit: 100 }),
  });
  const catalog = catalogData?.data ?? [];

  const newDrinkForm = useForm<NewDrinkValues>({
    resolver: zodResolver(CreateDrinkSchema),
    defaultValues: { name: "", ofd_spic: "" },
  });
  const [newDrinkFile, setNewDrinkFile] = useState<File | undefined>(undefined);

  const createGlobalDrinkMutation = useMutation({
    mutationFn: ({ data, file }: { data: NewDrinkValues; file?: File }) => drinksApi.create(data, file),
    onSuccess: (result, variables) => {
      toast.success("Товар добавлен в каталог!");
      queryClient.invalidateQueries({ queryKey: ["drinks"] });
      setSelectedDrinkId(String(result.drinkId));
      setPendingDrinkName(variables.data.name);
      setShowNewDrinkForm(false);
      newDrinkForm.reset({ name: "", ofd_spic: "" });
      setNewDrinkFile(undefined);
    },
    onError: () => toast.error("Не удалось создать товар"),
  });

  const detailsForm = useForm<DrinkDetailsValues>({
    resolver: zodResolver(DrinkDetailsSchema),
    defaultValues: { vendor_product_name: "", product_price: 0, vendor_product_price: 0 },
  });

  const assignMutation = useMutation({
    mutationFn: ({ data, file }: { data: DrinkDetailsValues; file?: File }) =>
      drinksApi.assignToPartner(
        {
          partner_id: partnerId,
          drink_id: Number(selectedDrinkId),
          vendor_product_name: data.vendor_product_name,
          product_price: data.product_price,
          vendor_product_price: data.vendor_product_price,
          category_ids: categoryIds,
        },
        file
      ),
    onSuccess: (pd, variables) => {
      toast.success("Товар добавлен в меню!");
      const catalogDrink = catalog.find((d) => String(d.id) === selectedDrinkId);
      const label = variables.data.vendor_product_name || pendingDrinkName || catalogDrink?.name || `#${pd.id}`;
      onAdd({ id: pd.id, label });
      setSelectedDrinkId("");
      setPendingDrinkName(undefined);
      setCategoryIds([]);
      setFile(undefined);
      detailsForm.reset({ vendor_product_name: "", product_price: 0, vendor_product_price: 0 });
    },
    onError: () => toast.error("Не удалось добавить товар"),
  });

  const toggleCategory = (id: number) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleAssign = detailsForm.handleSubmit((data) => {
    if (!selectedDrinkId) {
      toast.error("Сначала выберите или создайте товар");
      return;
    }
    if (!file) {
      toast.error("Выберите изображение");
      return;
    }
    assignMutation.mutate({ data, file });
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Товары</h2>
        <p className="text-sm text-muted-foreground">
          Добавьте позиции меню для этого партнёра — выберите из общего каталога или создайте новую. Можно пропустить и закончить позже.
        </p>
      </div>

      {drinks.length > 0 && (
        <ul className="space-y-2">
          {drinks.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
              <Coffee className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{d.label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-4 rounded-lg border border-dashed border-border p-4">
        {!showNewDrinkForm ? (
          <div className="space-y-1.5">
            <Label>Товар</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableSelect
                  value={selectedDrinkId}
                  onValueChange={(id) => {
                    setSelectedDrinkId(id);
                    setPendingDrinkName(undefined);
                  }}
                  placeholder="Выберите из каталога…"
                  searchPlaceholder="Поиск товаров…"
                  items={catalog.map((d) => ({ value: String(d.id), label: d.name }))}
                />
              </div>
              <Button type="button" variant="outline" onClick={() => setShowNewDrinkForm(true)}>
                <Plus className="size-4" />
                Новый
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Новый товар каталога</Label>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowNewDrinkForm(false)}
                aria-label="Отмена"
              >
                <X className="size-4" />
              </button>
            </div>
            <Input placeholder="Название товара" {...newDrinkForm.register("name")} />
            {newDrinkForm.formState.errors.name && (
              <p className="text-xs text-destructive">{newDrinkForm.formState.errors.name.message}</p>
            )}
            <OfdSpicInput
              value={newDrinkForm.watch("ofd_spic") ?? ""}
              onValueChange={(v) => newDrinkForm.setValue("ofd_spic", v)}
            />
            {newDrinkForm.formState.errors.ofd_spic && (
              <p className="text-xs text-destructive">{newDrinkForm.formState.errors.ofd_spic.message}</p>
            )}
            <Input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setNewDrinkFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              size="sm"
              disabled={createGlobalDrinkMutation.isPending}
              onClick={newDrinkForm.handleSubmit((data) => {
                if (!newDrinkFile) {
                  toast.error("Выберите изображение");
                  return;
                }
                createGlobalDrinkMutation.mutate({ data, file: newDrinkFile });
              })}
            >
              {createGlobalDrinkMutation.isPending ? "Создание…" : "Создать товар"}
            </Button>
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="onboarding-drink-vendor-name">Название в меню</Label>
            <Input
              id="onboarding-drink-vendor-name"
              placeholder="напр. Капучино 300 мл"
              {...detailsForm.register("vendor_product_name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-drink-price">Цена</Label>
              <Input
                id="onboarding-drink-price"
                type="number"
                {...detailsForm.register("product_price", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-drink-vendor-price">Цена вендора</Label>
              <Input
                id="onboarding-drink-vendor-price"
                type="number"
                {...detailsForm.register("vendor_product_price", { valueAsNumber: true })}
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label>Категории</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Badge
                    key={c.id}
                    variant={categoryIds.includes(c.id) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleCategory(c.id)}
                  >
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="onboarding-drink-image">Изображение</Label>
            <Input
              id="onboarding-drink-image"
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>

          <Button type="submit" disabled={assignMutation.isPending}>
            {assignMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Добавление…
              </>
            ) : (
              "Добавить товар в меню"
            )}
          </Button>
        </form>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>Назад</Button>
        <Button onClick={onContinue}>
          {drinks.length === 0 ? "Пропустить" : "Продолжить"}
        </Button>
      </div>
    </div>
  );
}
