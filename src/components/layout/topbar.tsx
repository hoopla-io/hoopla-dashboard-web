import { Search, Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { usePageHeaderStore } from "@/stores/page-header-store";

export function TopBar() {
  const [commandOpen, setCommandOpen] = useState(false);
  const title = usePageHeaderStore((s) => s.title);
  const description = usePageHeaderStore((s) => s.description);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur md:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="md:hidden">
              <Menu className="size-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          {title ? (
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {title}
              </span>
              {description ? (
                <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                  {description}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted md:flex md:w-72"
        >
          <Search className="size-3.5" />
          <span>Search…</span>
          <kbd className="ml-auto inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </button>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
