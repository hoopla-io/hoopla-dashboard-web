import { create } from "zustand";

type PageHeaderState = {
  title: string;
  description: string | null;
  setHeader: (title: string, description?: string | null) => void;
  reset: () => void;
};

export const usePageHeaderStore = create<PageHeaderState>((set) => ({
  title: "",
  description: null,
  setHeader: (title, description = null) => set({ title, description }),
  reset: () => set({ title: "", description: null }),
}));
