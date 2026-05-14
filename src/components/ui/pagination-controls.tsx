
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage: number;
  onPerPageChange: (perPage: number) => void;
  isLoading?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  perPage,
  onPerPageChange,
  isLoading,
}: PaginationControlsProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Rows</span>
        <Select
          value={String(perPage)}
          onValueChange={(v) => onPerPageChange(Number(v))}
        >
          <SelectTrigger className="h-7 w-[64px] text-xs">
            <SelectValue placeholder={String(perPage)} />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)} className="text-xs">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">
          Page <span className="font-mono tabular-nums text-foreground">{currentPage}</span> of{" "}
          <span className="font-mono tabular-nums text-foreground">{totalPages || 1}</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="size-7"
        >
          <span className="sr-only">Previous page</span>
          <ChevronLeft className="size-4" />
        </Button>

        <div className="hidden items-center gap-0.5 sm:flex">
          {getPageNumbers().map((page, i) =>
            typeof page === "number" ? (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={
                  currentPage === page
                    ? "h-7 min-w-7 px-2 font-mono text-xs tabular-nums bg-muted text-foreground hover:bg-muted"
                    : "h-7 min-w-7 px-2 font-mono text-xs tabular-nums text-muted-foreground"
                }
              >
                {page}
              </Button>
            ) : (
              <span key={i} className="px-1 text-xs text-muted-foreground">
                {page}
              </span>
            )
          )}
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="size-7"
        >
          <span className="sr-only">Next page</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
