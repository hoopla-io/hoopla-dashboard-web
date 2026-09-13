import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmContext, type ConfirmOptions } from "@/hooks/use-confirm";

type ConfirmProviderProps = {
  children: React.ReactNode;
};

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolveRef.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={Boolean(options)} onOpenChange={(open) => !open && settle(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{options?.title}</DialogTitle>
            <DialogDescription>{options?.description ?? "This action cannot be undone."}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => settle(true)}>
              {options?.confirmText ?? "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
