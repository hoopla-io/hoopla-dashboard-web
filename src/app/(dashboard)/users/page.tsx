
import { Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import { Trash2, Pencil, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { PageToolbar } from "@/components/layout/page-toolbar";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTableSort } from "@/hooks/use-table-sort";
import { useConfirm } from "@/hooks/use-confirm";
import { usersApi } from "@/lib/api/domains/users";
import type { User, EditUserRequest } from "@/lib/api/schemas/users";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ru-RU");
};

function UsersContent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [nameFilter, setNameFilter] = useQueryState(
    "name",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [phoneFilter, setPhoneFilter] = useQueryState(
    "phone",
    parseAsString.withOptions({ throttleMs: 500 }).withDefault("")
  );
  const [genderFilter, setGenderFilter] = useQueryState("gender", parseAsString.withDefault("all"));
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() =>
    setCurrentPage(1)
  );

  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<EditUserRequest>({});

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", currentPage, perPage, nameFilter, phoneFilter, genderFilter, sortParam, orderParam],
    queryFn: () =>
      usersApi.getAll({
        page: currentPage,
        limit: perPage,
        name: nameFilter || undefined,
        phone_number: phoneFilter || undefined,
        gender: genderFilter !== "all" ? genderFilter : undefined,
        sort: sortParam,
        order: orderParam,
      }),
  });

  const users = usersData?.data || [];
  const meta = usersData?.meta;
  const totalPages = meta?.totalPages || 1;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditUserRequest }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Пользователь обновлён");
      setEditUser(null);
    },
    onError: () => toast.error("Не удалось обновить пользователя"),
  });

  const confirmDelete = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Пользователь удалён");
    },
    onError: () => toast.error("Не удалось удалить пользователя"),
  });

  const clearFilters = () => {
    setNameFilter(null);
    setPhoneFilter(null);
    setGenderFilter(null);
    setCurrentPage(1);
  };

  const hasFilters = !!nameFilter || !!phoneFilter || genderFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader title="Пользователи" description="Просмотр, редактирование и удаление зарегистрированных пользователей." />

      <PageToolbar className="flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-end">
        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3">
          <Input
            placeholder="Имя"
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value || null);
              setCurrentPage(1);
            }}
          />
          <Input
            placeholder="Телефон"
            value={phoneFilter}
            onChange={(e) => {
              setPhoneFilter(e.target.value || null);
              setCurrentPage(1);
            }}
          />
          <Select
            value={genderFilter}
            onValueChange={(v) => {
              setGenderFilter(v === "all" ? null : v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Пол" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой пол</SelectItem>
              <SelectItem value="male">Мужской</SelectItem>
              <SelectItem value="female">Женский</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
          Сбросить фильтры
        </Button>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead column="name" sort={sort} order={order} onSort={onSort}>
                Имя
              </SortableTableHead>
              <SortableTableHead column="phone_number" sort={sort} order={order} onSort={onSort}>
                Телефон
              </SortableTableHead>
              <SortableTableHead column="mobile_provider" sort={sort} order={order} onSort={onSort}>
                Оператор
              </SortableTableHead>
              <SortableTableHead column="gender" sort={sort} order={order} onSort={onSort}>
                Пол
              </SortableTableHead>
              <TableHead>Дата рождения</TableHead>
              <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                Создан
              </SortableTableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="Пользователи не найдены"
                    description={
                      hasFilters
                        ? "Попробуйте сбросить фильтры."
                        : "Здесь появятся зарегистрированные пользователи."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  <TableCell className="text-sm font-medium text-foreground">
                    {user.name || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {user.phone_number || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.mobile_provider || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.gender === "male" ? "Мужской" : user.gender === "female" ? "Женский" : user.gender || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(user.date_of_birth)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {user.phone_number && (
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link
                            to={`/orders?search=${encodeURIComponent(user.phone_number)}`}
                            aria-label="Заказы пользователя"
                            title="Заказы пользователя"
                          >
                            <ShoppingCart className="size-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditUser(user);
                          setFormData({
                            name: user.name,
                            phone_number: user.phone_number,
                            gender: user.gender,
                            mobile_provider: user.mobile_provider,
                          });
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => { if (await confirmDelete({ title: "Удалить пользователя?" })) deleteMutation.mutate(user.id); }}
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
          onPageChange={(p) => setCurrentPage(p)}
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </DataTableShell>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>Обновите данные пользователя.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editUser) updateMutation.mutate({ id: editUser.id, data: formData });
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Имя</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Имя пользователя"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Телефон</Label>
                <Input
                  value={formData.phone_number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="Номер телефона"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Пол</Label>
                <Input
                  value={formData.gender || ""}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  placeholder="Пол"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Мобильный оператор</Label>
                <Input
                  value={formData.mobile_provider || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile_provider: e.target.value })
                  }
                  placeholder="Мобильный оператор"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                Отмена
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Сохранение…" : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ErrorBoundary pageName="Пользователи">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Загрузка пользователей…
          </div>
        }
      >
        <UsersContent />
      </Suspense>
    </ErrorBoundary>
  );
}
