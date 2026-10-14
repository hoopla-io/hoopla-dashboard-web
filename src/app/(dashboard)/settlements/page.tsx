import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { partnersApi } from "@/lib/api/domains/partners";
import { SettlementsPanel } from "@/app/(dashboard)/settlements/SettlementsPanel";

function SettlementsContent() {
  const [partnerId, setPartnerId] = useState<number | null>(null);

  // The backend caps page size at 100, so fetch every page to list all partners.
  const { data: partners = [] } = useQuery({
    queryKey: ["partners", "for-settlements"],
    queryFn: async () => {
      const first = await partnersApi.getAll({ page: 1, limit: 100 });
      const totalPages = first.meta?.totalPages ?? 1;
      let all = first.data ?? [];
      for (let p = 2; p <= totalPages; p++) {
        const next = await partnersApi.getAll({ page: p, limit: 100 });
        all = all.concat(next.data ?? []);
      }
      return all;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Взаиморасчёты"
        description="Отслеживание заказов, за которые Hoopla выплатил партнёрам."
      />

      <div className="max-w-sm space-y-1">
        <Label>Партнёр</Label>
        <Select
          value={partnerId ? String(partnerId) : undefined}
          onValueChange={(v) => setPartnerId(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите партнёра" />
          </SelectTrigger>
          <SelectContent>
            {partners.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {partnerId ? (
        <SettlementsPanel partnerId={partnerId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Выберите партнёра, чтобы просмотреть его заказы и управлять взаиморасчётами.
        </p>
      )}
    </div>
  );
}

export default function SettlementsPage() {
  return (
    <ErrorBoundary pageName="Взаиморасчёты">
      <Suspense
        fallback={<div className="p-8 text-center text-sm text-muted-foreground">Загрузка…</div>}
      >
        <SettlementsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
