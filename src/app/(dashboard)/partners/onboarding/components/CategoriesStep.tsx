import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Tag, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/hooks/use-confirm";
import { categoryApi } from "@/lib/api/domains/drinks";
import type { DrinkCategory } from "@/lib/api/schemas/drinks";

const CategoryFormSchema = z.object({
  name: z.string().min(1, "Укажите название"),
});
type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

interface CategoriesStepProps {
  partnerId: number;
  categories: DrinkCategory[];
  onAdd: (category: DrinkCategory) => void;
  onRemove: (id: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function CategoriesStep({
  partnerId,
  categories,
  onAdd,
  onRemove,
  onContinue,
  onBack,
}: CategoriesStepProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: { name: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormValues) => categoryApi.create({ partner_id: partnerId, name: data.name }),
    onSuccess: (result, variables) => {
      onAdd({ id: result.categoryId, name: variables.name });
      form.reset({ name: "" });
    },
    onError: () => toast.error("Не удалось создать категорию"),
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const confirmDelete = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onMutate: (id) => setDeletingId(id),
    onSuccess: (_data, id) => onRemove(id),
    onError: () => toast.error("Не удалось удалить категорию"),
    onSettled: () => setDeletingId(null),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Категории товаров</h2>
        <p className="text-sm text-muted-foreground">
          Например: Кофе, Холодные напитки, Десерты — добавьте сколько нужно или пропустите этот шаг.
        </p>
      </div>

      {categories.length > 0 && (
        <ul className="space-y-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5"
            >
              <Tag className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">{c.name}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                onClick={async () => { if (await confirmDelete({ title: `Удалить «${c.name}»?` })) deleteMutation.mutate(c.id); }}
                disabled={deletingId === c.id}
                aria-label={`Убрать «${c.name}»`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
        className="flex items-start gap-2"
      >
        <div className="flex-1">
          <Input placeholder="Название категории" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <Button type="submit" variant="outline" disabled={createMutation.isPending}>
          <Plus className="size-4" />
          Добавить
        </Button>
      </form>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>Назад</Button>
        <Button onClick={onContinue}>
          {categories.length === 0 ? "Пропустить" : "Продолжить"}
        </Button>
      </div>
    </div>
  );
}
