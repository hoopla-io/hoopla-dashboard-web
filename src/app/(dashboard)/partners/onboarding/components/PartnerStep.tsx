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
    defaultValues: { name: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreatePartnerRequest; file?: File }) =>
      partnersApi.create(data, file),
    onSuccess: (result, variables) => {
      toast.success("Partner created!");
      onCreated({ id: result.partner_id, name: variables.data.name });
    },
    onError: () => toast.error("Failed to create partner"),
  });

  if (createdPartner) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Check className="size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{createdPartner.name}</p>
            <p className="text-xs text-muted-foreground">Partner created</p>
          </div>
        </div>
        <div className="flex justify-end">
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
        <h2 className="text-lg font-semibold text-foreground">Partner details</h2>
        <p className="text-sm text-muted-foreground">Start by creating the coffee chain.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-partner-name">Name</Label>
        <Input id="onboarding-partner-name" placeholder="e.g. Morselle" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-partner-description">Description</Label>
        <Textarea id="onboarding-partner-description" placeholder="Optional" {...form.register("description")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-partner-logo">Logo</Label>
        <Input
          id="onboarding-partner-logo"
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files?.[0])}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Creating…
            </>
          ) : (
            "Create partner & continue"
          )}
        </Button>
      </div>
    </form>
  );
}
