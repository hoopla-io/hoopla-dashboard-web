
import { useTheme } from "next-themes";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your dashboard preferences." />

      <div className="max-w-2xl space-y-4">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <header className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-medium text-foreground">Appearance</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Customize how the dashboard looks.
            </p>
          </header>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="space-y-0.5">
                <Label className="text-sm text-foreground">Dark mode</Label>
                <p className="text-xs text-muted-foreground">
                  Switch the entire dashboard to a darker palette.
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
