import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { partnersApi } from "@/lib/api/domains/partners";
import { CreatePartnerSchema, type CreatePartnerRequest } from "@/lib/api/schemas/partners";

interface PartnerStepProps {
  createdPartner: { id: number; name: string } | null;
  onCreated: (partner: { id: number; name: string }) => void;
  onContinue: () => void;
}

export function PartnerStep({ createdPartner, onCreated, onContinue }: PartnerStepProps) {
  const [file, setFile] = useState<File | undefined>(undefined);
  const form = useForm<CreatePartnerRequest>({
    resolver: zodResolver(CreatePartnerSchema),
    defaultValues: { name: "", description: "", type: "normal" },
  });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreatePartnerRequest; file?: File }) =>
      partnersApi.create(data, file),
    onSuccess: (result, variables) => {
      toast.success("Партнёр создан!");
      onCreated({ id: result.partner_id, name: variables.data.name });
    },
    onError: () => toast.error("Не удалось создать партнёра"),
  });

  if (createdPartner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Check className="size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{createdPartner.name}</p>
            <p className="text-xs text-muted-foreground">Партнёр создан</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onContinue}>Продолжить</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((data) => createMutation.mutate({ data, file }))}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">Данные партнёра</h2>
        <p className="text-sm text-muted-foreground">Начните с создания сети кофеен.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-partner-name">Название</Label>
        <Input id="onboarding-partner-name" placeholder="напр. Morselle" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-partner-description">Описание</Label>
        <Textarea id="onboarding-partner-description" placeholder="Необязательно" {...form.register("description")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-partner-logo">Логотип</Label>
        <Input
          id="onboarding-partner-logo"
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files?.[0])}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="onboarding-partner-type">Тестовый партнёр</Label>
          <p className="text-xs text-muted-foreground">
            Скрыт от реальных клиентов — виден только с заголовком X-Hoopla-Test. Используйте для тестирования и разработки.
          </p>
        </div>
        <Switch
          id="onboarding-partner-type"
          checked={form.watch("type") === "test"}
          onCheckedChange={(checked) => form.setValue("type", checked ? "test" : "normal")}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Создание…
            </>
          ) : (
            "Создать партнёра и продолжить"
          )}
        </Button>
      </div>
    </form>
  );
}
