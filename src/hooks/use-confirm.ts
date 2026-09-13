import { createContext, useContext } from "react";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
};

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used within ConfirmProvider");
  return confirm;
}
