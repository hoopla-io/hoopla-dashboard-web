import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { appReleasesApi } from "@/lib/api/domains/app-releases";
import type { AppRelease, AppReleasePlatform } from "@/lib/api/schemas/app-releases";

const MAX_FILE_SIZE = 500 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function extractError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

type ReleaseCardProps = {
  platform: AppReleasePlatform;
  label: string;
  fileExt: string;
  accept: string;
  icon: LucideIcon;
};

export function ReleaseCard({ platform, label, fileExt, accept, icon: Icon }: ReleaseCardProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [version, setVersion] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ["app-releases", platform],
    queryFn: () => appReleasesApi.list(platform),
  });

  const latest = releases[0];

  const createMutation = useMutation({
    mutationFn: (vars: { platform: AppReleasePlatform; version: string; forceUpdate: boolean; file: File }) =>
      appReleasesApi.create(vars, (progressEvent) => {
        if (!progressEvent.total) return;
        setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-releases", platform] });
      toast.success(`${label} release uploaded`);
      setVersion("");
      setForceUpdate(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => toast.error(extractError(err, `Failed to upload ${label} release`)),
    onSettled: () => setUploadProgress(null),
  });

  const deleteMutation = useMutation({
    mutationFn: appReleasesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-releases", platform] });
      toast.success("Release deleted");
    },
    onError: () => toast.error("Failed to delete release"),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(`.${fileExt}`)) {
      toast.error(`Only ${accept} files are allowed`);
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 500MB");
      e.target.value = "";
      return;
    }
    setFile(selected);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!version.trim()) {
      toast.error("Version is required");
      return;
    }
    if (!file) {
      toast.error("Select a file to upload");
      return;
    }
    createMutation.mutate({ platform, version: version.trim(), forceUpdate, file });
  }

  function handleDelete(release: AppRelease) {
    if (!confirm(`Delete ${label} version ${release.version}?`)) return;
    deleteMutation.mutate(release.id);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">{label}</h2>
        </div>
        {latest ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Current: v{latest.version} · uploaded {new Date(latest.created_at).toLocaleDateString()}
            {latest.file_size ? ` · ${formatFileSize(latest.file_size)}` : ""}
            {latest.force_update ? " · force update" : ""}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">No release uploaded yet.</p>
        )}
      </header>

      <div className="space-y-4 px-5 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${platform}-version`}>Version</Label>
            <Input
              id={`${platform}-version`}
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 1.4.2"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor={`${platform}-force`}>Force update</Label>
              <p className="text-xs text-muted-foreground">
                Blocks the app with a full-screen update prompt instead of a dismissible banner.
              </p>
            </div>
            <Switch id={`${platform}-force`} checked={forceUpdate} onCheckedChange={setForceUpdate} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${platform}-file`}>Package ({accept})</Label>
            <Input
              id={`${platform}-file`}
              type="file"
              ref={fileInputRef}
              accept={accept}
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          {uploadProgress !== null ? (
            <div className="space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
            </div>
          ) : null}

          <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
            {createMutation.isPending ? "Uploading…" : "Upload release"}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">History</p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : releases.length === 0 ? (
            <p className="text-xs text-muted-foreground">No uploads yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {releases.map((release) => (
                <li
                  key={release.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium text-foreground">
                      v{release.version}
                      {release.force_update ? (
                        <Badge variant="outline" className="text-[10px]">
                          Force
                        </Badge>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(release.created_at).toLocaleString()}
                      {release.file_size ? ` · ${formatFileSize(release.file_size)}` : ""}
                      {release.original_name ? ` · ${release.original_name}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(release)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
