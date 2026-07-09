
import { Suspense, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";

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
import { usersApi } from "@/lib/api/domains/users";
import type { User, EditUserRequest } from "@/lib/api/schemas/users";

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString();
};

function UsersContent() {
  const queryClient = useQueryClient();
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
      toast.success("User updated");
      setEditUser(null);
    },
    onError: () => toast.error("Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
    onError: () => toast.error("Failed to delete user"),
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
      <PageHeader title="Users" description="Browse, edit, and remove registered users." />

      <PageToolbar className="flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-end">
        <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3">
          <Input
            placeholder="Name"
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value || null);
              setCurrentPage(1);
            }}
          />
          <Input
            placeholder="Phone"
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
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilters}>
          Clear filters
        </Button>
      </PageToolbar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead column="name" sort={sort} order={order} onSort={onSort}>
                Name
              </SortableTableHead>
              <SortableTableHead column="phone_number" sort={sort} order={order} onSort={onSort}>
                Phone
              </SortableTableHead>
              <SortableTableHead column="mobile_provider" sort={sort} order={order} onSort={onSort}>
                Provider
              </SortableTableHead>
              <SortableTableHead column="gender" sort={sort} order={order} onSort={onSort}>
                Gender
              </SortableTableHead>
              <SortableTableHead column="date_of_birth" sort={sort} order={order} onSort={onSort}>
                Birth date
              </SortableTableHead>
              <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                Created
              </SortableTableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    title="No users found"
                    description={
                      hasFilters
                        ? "Try clearing your filters."
                        : "Registered users will appear here."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User) => (
                <TableRow key={user.id}>
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
                    {user.gender || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(user.date_of_birth)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
                        onClick={() => deleteMutation.mutate(user.id)}
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
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editUser) updateMutation.mutate({ id: editUser.id, data: formData });
            }}
          >
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="User name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={formData.phone_number || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Input
                  value={formData.gender || ""}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  placeholder="Gender"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile provider</Label>
                <Input
                  value={formData.mobile_provider || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile_provider: e.target.value })
                  }
                  placeholder="Mobile provider"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
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
    <ErrorBoundary pageName="Users">
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading users…
          </div>
        }
      >
        <UsersContent />
      </Suspense>
    </ErrorBoundary>
  );
}
