import { Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";
import { StepShell, type WizardStep } from "@/components/wizard/step-shell";
import { PartnerStep } from "./components/PartnerStep";
import { ShopStep } from "./components/ShopStep";
import { CategoriesStep } from "./components/CategoriesStep";
import { DrinksStep } from "./components/DrinksStep";
import { ReviewStep } from "./components/ReviewStep";
import type { DrinkCategory } from "@/lib/api/schemas/drinks";

const STEPS: WizardStep[] = [
  { key: "partner", label: "Partner" },
  { key: "shop", label: "Shop" },
  { key: "categories", label: "Categories" },
  { key: "drinks", label: "Drinks" },
  { key: "review", label: "Review" },
];

interface EntityRef {
  id: number;
  name: string;
}

interface AddedDrink {
  id: number;
  label: string;
}

function OnboardingContent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [partner, setPartner] = useState<EntityRef | null>(null);
  const [shop, setShop] = useState<EntityRef | null>(null);
  const [categories, setCategories] = useState<DrinkCategory[]>([]);
  const [drinks, setDrinks] = useState<AddedDrink[]>([]);

  const goTo = (index: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, index)));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/partners")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Onboard a new partner</h1>
          <p className="text-sm text-muted-foreground">
            Create a partner, its first shop, categories, and drinks in one guided flow.
          </p>
        </div>
      </div>

      <StepShell steps={STEPS} currentStep={step}>
        {step === 0 && (
          <PartnerStep
            createdPartner={partner}
            onCreated={(p) => {
              setPartner(p);
              goTo(1);
            }}
            onContinue={() => goTo(1)}
          />
        )}

        {step === 1 && partner && (
          <ShopStep
            partnerId={partner.id}
            createdShop={shop}
            onCreated={(s) => {
              setShop(s);
              goTo(2);
            }}
            onContinue={() => goTo(2)}
            onBack={() => goTo(0)}
          />
        )}

        {step === 2 && partner && (
          <CategoriesStep
            partnerId={partner.id}
            categories={categories}
            onAdd={(c) => setCategories((prev) => [...prev, c])}
            onRemove={(id) => setCategories((prev) => prev.filter((c) => c.id !== id))}
            onContinue={() => goTo(3)}
            onBack={() => goTo(1)}
          />
        )}

        {step === 3 && partner && (
          <DrinksStep
            partnerId={partner.id}
            categories={categories}
            drinks={drinks}
            onAdd={(d) => setDrinks((prev) => [...prev, d])}
            onContinue={() => goTo(4)}
            onBack={() => goTo(2)}
          />
        )}

        {step === 4 && partner && (
          <ReviewStep
            partnerId={partner.id}
            partnerName={partner.name}
            shopName={shop?.name ?? null}
            categoryCount={categories.length}
            drinkCount={drinks.length}
          />
        )}
      </StepShell>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ErrorBoundary pageName="Partner Onboarding">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
        <OnboardingContent />
      </Suspense>
    </ErrorBoundary>
  );
}
