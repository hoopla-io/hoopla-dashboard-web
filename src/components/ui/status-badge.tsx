import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const dotVariants = cva("size-1.5 rounded-full shrink-0", {
  variants: {
    tone: {
      neutral: "bg-muted-foreground",
      success: "bg-emerald-500 dark:bg-emerald-400",
      warning: "bg-amber-500 dark:bg-amber-400",
      info: "bg-sky-500 dark:bg-sky-400",
      danger: "bg-red-500 dark:bg-red-400",
      pending: "bg-orange-500 dark:bg-orange-400",
      processing: "bg-blue-500 dark:bg-blue-400",
    },
  },
  defaultVariants: { tone: "neutral" },
});

type StatusBadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof dotVariants> & {
    label: string;
  };

export function StatusBadge({ label, tone, className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground",
        className
      )}
      {...props}
    >
      <span className={dotVariants({ tone })} />
      {label}
    </span>
  );
}

export type StatusTone = NonNullable<VariantProps<typeof dotVariants>["tone"]>;
