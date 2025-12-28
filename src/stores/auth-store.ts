import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  id: number;
  name?: string;
  login?: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user: User) => {
        set({
          user: user ?? null,
          isAuthenticated: true,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "hoopla-auth",
    }
  )
);
