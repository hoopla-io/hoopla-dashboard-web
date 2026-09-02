import { useNavigate } from "react-router-dom";
import { Building2, Check, Coffee, Store, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewStepProps {
  partnerId: number;
  partnerName: string;
  shopName: string | null;
  categoryCount: number;
  drinkCount: number;
}

export function ReviewStep({ partnerId, partnerName, shopName, categoryCount, drinkCount }: ReviewStepProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <Check className="size-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Partner onboarded</p>
          <p className="text-xs text-muted-foreground">Everything below is already live in the dashboard.</p>
        </div>
      </div>

      <ul className="space-y-2">
        <li className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">{partnerName}</span>
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Store className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">{shopName ?? "No shop created yet"}</span>
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Tag className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {categoryCount} categor{categoryCount === 1 ? "y" : "ies"}
          </span>
        </li>
        <li className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Coffee className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">{drinkCount} products added</span>
        </li>
      </ul>

      <div className="flex justify-end pt-2">
        <Button onClick={() => navigate(`/partners/${partnerId}`)}>Go to partner</Button>
      </div>
    </div>
  );
}
