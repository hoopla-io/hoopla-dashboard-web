
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Image from "@/components/ui/image";
import { useNavigate } from "react-router-dom";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { useConfirm } from "@/hooks/use-confirm";
import { notificationsApi } from "@/lib/api/domains/notifications";
import type { Notification, CreateNotificationRequest } from "@/lib/api/schemas/notifications";

function NotificationsContent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withOptions({ throttleMs: 500 }).withDefault(""));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() =>
    setCurrentPage(1)
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editNotification, setEditNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState<CreateNotificationRequest>({ title: "", text: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications", currentPage, search, perPage, sortParam, orderParam],
    queryFn: () => notificationsApi.getAll({
      page: currentPage,
      limit: perPage,
      sort: sortParam,
      order: orderParam,
    }),
  });

  const notifications = notificationsData?.data || [];
  const meta = notificationsData?.meta;
  const totalPages = meta?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateNotificationRequest; file?: File }) =>
      notificationsApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Уведомление создано");
      setIsCreateOpen(false);
      setFormData({ title: "", text: "" });
      setSelectedFile(null);
    },
    onError: () => toast.error("Не удалось создать уведомление"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateNotificationRequest>; file?: File }) =>
      notificationsApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Уведомление обновлено");
      setEditNotification(null);
      setSelectedFile(null);
    },
    onError: () => toast.error("Не удалось обновить уведомление"),
  });

  const confirmDelete = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Уведомление удалено");
    },
    onError: () => toast.error("Не удалось удалить уведомление"),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Уведомления в приложении"
        description="Объявления в ленте уведомлений приложения. Они не отправляются как push."
        action={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            Добавить уведомление
          </Button>
        }
      />

      <PageToolbar>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск уведомлений"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value || null);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead className="w-[64px]" column="id" sort={sort} order={order} onSort={onSort}>
                ID
              </SortableTableHead>
              <TableHead className="w-[64px]">Изображение</TableHead>
              <SortableTableHead column="title" sort={sort} order={order} onSort={onSort}>
                Заголовок
              </SortableTableHead>
              <TableHead>Текст</TableHead>
              <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                Создано
              </SortableTableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    title="Уведомлений пока нет"
                    description="Создайте первое уведомление для пользователей приложения."
                    action={
                      <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="size-4" />
                        Добавить уведомление
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow
                  key={notification.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/notifications/${notification.id}`)}
                >
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{notification.id}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {notification.image_url ? (
                      <button
                        type="button"
                        className="relative size-10 overflow-hidden rounded-md ring-1 ring-border transition-opacity hover:opacity-80"
                        onClick={() => setPreviewImage(notification.image_url!)}
                      >
                        <Image
                          src={notification.image_url}
                          alt={notification.title}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                        Нет
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {notification.title}
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1 max-w-[360px] text-xs text-muted-foreground">
                      {notification.text}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditNotification(notification);
                          setFormData({
                            title: notification.title,
                            text: notification.text,
                            url: notification.url || "",
                          });
                          setSelectedFile(null);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => { if (await confirmDelete({ title: "Удалить уведомление?" })) deleteMutation.mutate(notification.id); }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={(v) => {
            setPerPage(v);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </DataTableShell>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать уведомление</DialogTitle>
            <DialogDescription>Создайте новое уведомление в приложении</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ data: formData, file: selectedFile || undefined });
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Заголовок</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Заголовок уведомления"
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Текст</Label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Текст уведомления"
                  required
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
                <Label>Изображение (необязательно)</Label>
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
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Создание..." : "Создать"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Просмотр изображения</DialogTitle>
            <DialogDescription>Просмотр изображения уведомления</DialogDescription>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Превью уведомления" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editNotification} onOpenChange={(open) => {
        if (!open) {
          setEditNotification(null);
          setSelectedFile(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать уведомление</DialogTitle>
            <DialogDescription>Измените содержимое уведомления</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editNotification) {
              updateMutation.mutate({
                id: editNotification.id,
                data: formData,
                file: selectedFile || undefined,
              });
            }
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
                  {editNotification && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                      {selectedFile ? (
                        <Image
                          src={URL.createObjectURL(selectedFile)}
                          alt="Новое превью"
                          fill
                          className="object-cover"
                        />
                      ) : editNotification.image_url ? (
                        <Image
                          src={editNotification.image_url}
                          alt={editNotification.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] font-medium text-muted-foreground">
                          Нет
                        </div>
                      )}
                    </div>
                  )}
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
              <Button type="button" variant="outline" onClick={() => {
                setEditNotification(null);
                setSelectedFile(null);
              }}>Отмена</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Загрузка уведомлений...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}
