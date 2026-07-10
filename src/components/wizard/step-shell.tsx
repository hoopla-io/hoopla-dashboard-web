import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  key: string;
  label: string;
}

interface StepShellProps {
  steps: WizardStep[];
  currentStep: number;
  children: ReactNode;
}

export function StepShell({ steps, currentStep, children }: StepShellProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <ol className="flex items-start">
        {steps.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <li key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isActive && !isDone && "border-primary text-primary",
                    !isDone && !isActive && "border-border text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("mx-2 h-px flex-1 translate-y-[-10px]", isDone ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-border bg-card p-6">{children}</div>
    </div>
  );
}
