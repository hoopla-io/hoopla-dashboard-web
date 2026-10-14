
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Bell, ExternalLink } from "lucide-react";
import Image from "@/components/ui/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { notificationsApi } from "@/lib/api/domains/notifications";
import type { CreateNotificationRequest } from "@/lib/api/schemas/notifications";

export function GeneralTab({ notificationId }: { notificationId: number }) {
  const queryClient = useQueryClient();

  const { data: notification, isLoading } = useQuery({
    queryKey: ["notification", notificationId],
    queryFn: () => notificationsApi.getById(notificationId),
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<CreateNotificationRequest>({ title: "", text: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ data, file }: { data: Partial<CreateNotificationRequest>; file?: File }) =>
      notificationsApi.update(notificationId, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification", notificationId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Уведомление обновлено");
      setIsEditOpen(false);
      setSelectedFile(null);
    },
    onError: () => toast.error("Не удалось обновить уведомление"),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Загрузка...</div>;
  if (!notification) return <div className="p-8 text-center text-destructive">Уведомление не найдено</div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Данные уведомления</CardTitle>
            <CardDescription>Информация об уведомлении</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData({ title: notification.title, text: notification.text, url: notification.url || "" });
              setSelectedFile(null);
              setIsEditOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {notification.image_url ? (
            <div className="relative h-48 w-full max-w-md overflow-hidden rounded-lg border">
              <Image
                src={notification.image_url}
                alt={notification.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-48 w-full max-w-md items-center justify-center rounded-lg border bg-muted">
              <Bell className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Заголовок</p>
              <p className="text-lg font-semibold">{notification.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Текст</p>
              <p className="whitespace-pre-wrap">{notification.text}</p>
            </div>
            {notification.url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">URL</p>
                <a
                  href={notification.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {notification.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Создано</p>
              <p>{new Date(notification.created_at).toLocaleString("ru-RU")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать уведомление</DialogTitle>
            <DialogDescription>Измените содержимое уведомления</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate({ data: formData, file: selectedFile || undefined });
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Заголовок</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Заголовок уведомления"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Текст</Label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Текст уведомления"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label>URL (необязательно)</Label>
                <Input
                  value={formData.url || ""}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Изображение</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                    {selectedFile ? (
                      <Image src={URL.createObjectURL(selectedFile)} alt="Превью" fill className="object-cover" />
                    ) : notification.image_url ? (
                      <Image src={notification.image_url} alt={notification.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Оставьте пустым, чтобы сохранить текущее изображение</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
