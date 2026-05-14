import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/brand/wordmark";
import { authApi } from "@/lib/api/domains/auth";
import { useAuthStore } from "@/stores/auth-store";
import { LoginRequestSchema, type LoginRequest } from "@/lib/api/schemas/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasHydrated, setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, hasHydrated, navigate]);

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setAuth(response.user!);
      toast.success("Signed in");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[oklch(0.20_0.08_8)]" />
        <div className="absolute -left-32 -top-40 size-130 rounded-full bg-primary opacity-80 blur-3xl" />
        <div className="absolute -right-48 top-1/3 size-140 rounded-full bg-[oklch(0.55_0.22_18)] opacity-60 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 size-150 rounded-full bg-[oklch(0.45_0.18_350)] opacity-60 blur-3xl" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="relative">
          <Wordmark className="text-3xl text-white" />
        </div>

        <div className="relative max-w-md space-y-5">
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white">
            One subscription.
            <br />
            <span className="text-white/70">Every coffee in the city.</span>
          </h2>
          <p className="text-sm leading-relaxed text-white/60">
            Manage partners, drinks, shops, and stories — every part of the
            Hoopla platform, from a single dashboard.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-6 text-[11px] uppercase tracking-[0.18em] text-white/40">
            <span>Partners</span>
            <span aria-hidden className="size-1 rounded-full bg-white/30" />
            <span>Shops</span>
            <span aria-hidden className="size-1 rounded-full bg-white/30" />
            <span>Stories</span>
            <span aria-hidden className="size-1 rounded-full bg-white/30" />
            <span>Orders</span>
          </div>
        </div>
      </aside>

      <main className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 lg:hidden">
            <Wordmark className="text-2xl text-foreground" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login" className="text-xs font-medium text-muted-foreground">
                Login
              </Label>
              <Input
                id="login"
                placeholder="your login"
                className="h-10"
                autoComplete="username"
                {...form.register("login")}
                disabled={isLoading}
              />
              {form.formState.errors.login && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.login.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-10"
                autoComplete="current-password"
                {...form.register("password")}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="h-10 w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
