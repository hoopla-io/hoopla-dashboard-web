
import { ReactNode, useEffect } from "react";
import { usePageHeaderStore } from "@/stores/page-header-store";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  const setHeader = usePageHeaderStore((s) => s.setHeader);
  const reset = usePageHeaderStore((s) => s.reset);

  useEffect(() => {
    setHeader(title, description ?? null);
    return () => reset();
  }, [title, description, setHeader, reset]);

  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3 pb-2", className)}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
