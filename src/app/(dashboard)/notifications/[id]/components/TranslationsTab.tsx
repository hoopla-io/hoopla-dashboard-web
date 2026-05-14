
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { notificationsApi, translationsApi } from "@/lib/api/domains/notifications";
import type { NotificationTranslation, CreateTranslationRequest, UpdateTranslationRequest } from "@/lib/api/schemas/notifications";

const ALL_LANGUAGES = ["uz", "ru", "en"] as const;
const LANGUAGE_LABELS: Record<string, string> = { uz: "Uzbek", ru: "Russian", en: "English" };

export function TranslationsTab({ notificationId }: { notificationId: number }) {
  const queryClient = useQueryClient();

  const { data: notification, isLoading } = useQuery({
    queryKey: ["notification", notificationId],
    queryFn: () => notificationsApi.getById(notificationId),
  });

  const translations = notification?.translations || [];
  const existingLanguages = translations.map((t) => t.language);
  const availableLanguages = ALL_LANGUAGES.filter((l) => !existingLanguages.includes(l));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTranslation, setEditTranslation] = useState<NotificationTranslation | null>(null);
  const [createForm, setCreateForm] = useState<CreateTranslationRequest>({
    notification_id: notificationId,
    language: "uz",
    title: "",
    text: "",
  });
  const [editForm, setEditForm] = useState<UpdateTranslationRequest>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notification", notificationId] });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateTranslationRequest; file?: File }) =>
      translationsApi.create(data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Translation created successfully!");
      setIsCreateOpen(false);
      setCreateForm({ notification_id: notificationId, language: "uz", title: "", text: "" });
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to create translation"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: UpdateTranslationRequest; file?: File }) =>
      translationsApi.update(id, data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Translation updated successfully!");
      setEditTranslation(null);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to update translation"),
  });

  const deleteMutation = useMutation({
    mutationFn: translationsApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Translation deleted successfully!");
    },
    onError: () => toast.error("Failed to delete translation"),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Translations</CardTitle>
            <CardDescription>Manage notification translations (uz, ru, en)</CardDescription>
          </div>
          <Button
            onClick={() => {
              if (availableLanguages.length > 0) {
                setCreateForm({
                  notification_id: notificationId,
                  language: availableLanguages[0],
                  title: "",
                  text: "",
                });
                setSelectedFile(null);
                setIsCreateOpen(true);
              }
            }}
            disabled={availableLanguages.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Translation
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Language</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {translations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No translations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  translations.map((translation) => (
                    <TableRow key={translation.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {LANGUAGE_LABELS[translation.language] || translation.language}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{translation.title || "—"}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground line-clamp-1 max-w-[300px]">
                          {translation.text || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            onClick={() => {
                              setEditTranslation(translation);
                              setEditForm({
                                language: translation.language,
                                title: translation.title || "",
                                text: translation.text || "",
                              });
                              setSelectedFile(null);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive cursor-pointer"
                            onClick={() => deleteMutation.mutate(translation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Translation Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Translation</DialogTitle>
            <DialogDescription>Create a new language translation</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ data: createForm, file: selectedFile || undefined });
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={createForm.language}
                  onValueChange={(v) => setCreateForm({ ...createForm, language: v as "uz" | "ru" | "en" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {LANGUAGE_LABELS[lang]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={createForm.title || ""}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Translated title"
                />
              </div>
              <div className="space-y-2">
                <Label>Text</Label>
                <textarea
                  value={createForm.text || ""}
                  onChange={(e) => setCreateForm({ ...createForm, text: e.target.value })}
                  placeholder="Translated text"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Image (Optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Translation Dialog */}
      <Dialog open={!!editTranslation} onOpenChange={(open) => {
        if (!open) {
          setEditTranslation(null);
          setSelectedFile(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Translation</DialogTitle>
            <DialogDescription>Update translation content</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editTranslation) {
              updateMutation.mutate({ id: editTranslation.id, data: editForm, file: selectedFile || undefined });
            }
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Input value={LANGUAGE_LABELS[editTranslation?.language || ""] || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Translated title"
                />
              </div>
              <div className="space-y-2">
                <Label>Text</Label>
                <textarea
                  value={editForm.text || ""}
                  onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                  placeholder="Translated text"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Image (Optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditTranslation(null);
                setSelectedFile(null);
              }}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
