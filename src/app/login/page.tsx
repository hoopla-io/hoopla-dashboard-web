"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/lib/api/domains/auth";
import { useAuthStore } from "@/stores/auth-store";
import { LoginRequestSchema, type LoginRequest } from "@/lib/api/schemas/auth";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/");
    }
  }, [isAuthenticated, hasHydrated, router]);

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setAuth(response.user!);
      toast.success("Login successful!");
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
              <rect width="48" height="48" rx="12" className="fill-primary" />
              <text x="24" y="33" textAnchor="middle" className="fill-primary-foreground" style={{ fontSize: "27px", fontWeight: 800, fontFamily: "system-ui, sans-serif" }}>H</text>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Hoopla</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                placeholder="Enter your login"
                {...form.register("login")}
                disabled={isLoading}
              />
              {form.formState.errors.login && (
                <p className="text-sm text-destructive">{form.formState.errors.login.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...form.register("password")}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
