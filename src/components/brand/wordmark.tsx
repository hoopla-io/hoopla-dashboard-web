import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-display tracking-wide lowercase leading-none select-none",
        className
      )}
    >
      hoopla
    </span>
  );
}
