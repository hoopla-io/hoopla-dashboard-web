import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shopsApi } from "@/lib/api/domains/shops";
import { CreateShopSchema } from "@/lib/api/schemas/shops";

const ShopFormSchema = CreateShopSchema.omit({ partner_id: true });
type ShopFormValues = z.infer<typeof ShopFormSchema>;

interface ShopStepProps {
  partnerId: number;
  createdShop: { id: number; name: string } | null;
  onCreated: (shop: { id: number; name: string }) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ShopStep({ partnerId, createdShop, onCreated, onContinue, onBack }: ShopStepProps) {
  const [file, setFile] = useState<File | undefined>(undefined);
  const form = useForm<ShopFormValues>({
    resolver: zodResolver(ShopFormSchema),
    defaultValues: { name: "", location_lat: 0, location_long: 0 },
  });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: ShopFormValues; file?: File }) =>
      shopsApi.create({ ...data, partner_id: partnerId }, file),
    onSuccess: (result, variables) => {
      toast.success("Shop created!");
      onCreated({ id: result.id, name: variables.data.name });
    },
    onError: () => toast.error("Failed to create shop"),
  });

  if (createdShop) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Check className="size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{createdShop.name}</p>
            <p className="text-xs text-muted-foreground">First shop created</p>
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onContinue}>Continue</Button>
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
        <h2 className="text-lg font-semibold text-foreground">First shop</h2>
        <p className="text-sm text-muted-foreground">Add the first physical location for this partner.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-shop-name">Name</Label>
        <Input id="onboarding-shop-name" placeholder="e.g. Morselle — Amir Temur" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="onboarding-shop-lat">Latitude</Label>
          <Input
            id="onboarding-shop-lat"
            type="number"
            step="any"
            {...form.register("location_lat", { valueAsNumber: true })}
          />
          {form.formState.errors.location_lat && (
            <p className="text-xs text-destructive">{form.formState.errors.location_lat.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onboarding-shop-long">Longitude</Label>
          <Input
            id="onboarding-shop-long"
            type="number"
            step="any"
            {...form.register("location_long", { valueAsNumber: true })}
          />
          {form.formState.errors.location_long && (
            <p className="text-xs text-destructive">{form.formState.errors.location_long.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-shop-image">Image</Label>
        <Input
          id="onboarding-shop-image"
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files?.[0])}
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Creating…
            </>
          ) : (
            "Create shop & continue"
          )}
        </Button>
      </div>
    </form>
  );
}
