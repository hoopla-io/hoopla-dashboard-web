import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
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
import { partnerUsersApi } from "@/lib/api/domains/partner-users";
import { shopsApi } from "@/lib/api/domains/shops";
import {
  PORTAL_ROLES,
  type PartnerUser,
  type PortalUserRole,
} from "@/lib/api/schemas/partner-users";

interface StaffTabProps {
  partnerId: number;
}

type RoleFilter = "ALL" | PortalUserRole;

interface StaffFormState {
  name: string;
  role: PortalUserRole;
  phone_number: string;
  password: string;
  shop_id: number | null;
}

const EMPTY_FORM: StaffFormState = {
  name: "",
  role: "OWNER",
  phone_number: "",
  password: "",
  shop_id: null,
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ACCOUNTANT: "secondary",
  MANAGER: "outline",
};

const PAGE_SIZE = 500;
const isPortalRole = (role: string): role is PortalUserRole =>
  (PORTAL_ROLES as readonly string[]).includes(role);

export function StaffTab({ partnerId }: StaffTabProps) {
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerUser | null>(null);
  const [form, setForm] = useState<StaffFormState>(EMPTY_FORM);

  const { data: shops } = useQuery({
    queryKey: ["shops", partnerId],
    queryFn: () => shopsApi.getByPartner(partnerId),
    enabled: !!partnerId,
  });

  const { data: staffData, isLoading, error } = useQuery({
    queryKey: ["partner-users", partnerId],
    queryFn: () => partnerUsersApi.getAll({ page: 1, limit: PAGE_SIZE, partner_id: partnerId }),
    enabled: !!partnerId,
  });

  // The server already scopes by partner_id (owner rows + this partner's shop
  // staff). Show only PORTAL roles here — cassa cashiers are managed in the
  // SHOP-detail Staff tab and must not be touched from here.
  const portalStaff = useMemo(
    () => (staffData?.data ?? []).filter((u) => isPortalRole(u.role)),
    [staffData]
  );

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return portalStaff.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (q) {
        const name = (u.name ?? "").toLowerCase();
        const phone = (u.phone_number ?? "").toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [portalStaff, roleFilter, search]);

  const shopsList = useMemo(() => shops ?? [], [shops]);
  const shopById = useMemo(() => {
    const map = new Map<number, string>();
    shopsList.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [shopsList]);

  const createMutation = useMutation({
    mutationFn: partnerUsersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-users"] });
      toast.success("User created");
      closeDialog();
    },
    onError: () => toast.error("Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & Parameters<typeof partnerUsersApi.update>[1]) =>
      partnerUsersApi.update(id, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-users"] });
      toast.success("User updated");
      closeDialog();
    },
    onError: () => toast.error("Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: partnerUsersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-users"] });
      toast.success("User deleted");
    },
    onError: () => toast.error("Failed to delete user"),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  }

  function openEdit(user: PartnerUser) {
    setEditing(user);
    setForm({
      name: user.name ?? "",
      role: isPortalRole(user.role) ? user.role : "OWNER",
      phone_number: user.phone_number ?? "",
      password: "",
      shop_id: user.shop_id ?? user.shop?.id ?? null,
    });
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const name = form.name.trim();
    // Canonical phone is digits only ("998..."); strip "+", spaces and any
    // separators so it matches what the merchant/cassa send at login.
    const phone = form.phone_number.replace(/\D/g, "");
    const password = form.password.trim();

    if (!phone) {
      return toast.error("Phone number is required");
    }
    if (!editing && !password) {
      return toast.error("Password is required for a new user");
    }
    // MANAGER is shop-scoped; OWNER / ACCOUNTANT are partner-wide.
    const isManager = form.role === "MANAGER";
    if (isManager && !form.shop_id) {
      return toast.error("Select a shop for a Manager");
    }

    const payload = {
      // Owner/Accountant attach to the partner; Manager attaches to a shop.
      partner_id: isManager ? undefined : partnerId,
      shop_id: isManager ? form.shop_id ?? undefined : undefined,
      name: name || undefined,
      phone_number: phone,
      role: form.role,
      password: password || undefined, // blank on edit => keep current
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(user: PartnerUser) {
    if (!confirm(`Delete ${user.name ?? user.phone_number ?? `#${user.id}`}?`)) return;
    deleteMutation.mutate(user.id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-64"
          />
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
            <SelectTrigger className="md:w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              {PORTAL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchant users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-destructive">
                      Failed to load users
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        title="No merchant users"
                        description="Merchant-portal users added for this partner will appear here."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((user) => {
                    const shopId = user.shop_id ?? user.shop?.id ?? null;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.phone_number ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ROLE_VARIANTS[user.role] ?? "outline"}>{user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.role === "MANAGER" && shopId
                            ? user.shop?.name ?? shopById.get(shopId) ?? `#${shopId}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDelete(user)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </DataTableShell>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit merchant user" : "Add merchant user"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update details. Leave password blank to keep the current one."
                  : "Merchant-portal user (merchant.hoopla.uz). They sign in with phone + password."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="portal-name">Name</Label>
                <Input
                  id="portal-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name (optional)"
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="portal-phone">Phone number</Label>
                  <Input
                    id="portal-phone"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    placeholder="998 90 123 45 67"
                    maxLength={255}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portal-password">Password</Label>
                  <Input
                    id="portal-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? "Leave blank to keep" : "Set a password"}
                    maxLength={255}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="portal-role">Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as PortalUserRole })}
                  >
                    <SelectTrigger id="portal-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PORTAL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {form.role === "MANAGER" && (
                  <div className="space-y-2">
                    <Label htmlFor="portal-shop">Shop (required)</Label>
                    <Select
                      value={form.shop_id ? String(form.shop_id) : undefined}
                      onValueChange={(v) => setForm({ ...form, shop_id: Number(v) })}
                    >
                      <SelectTrigger id="portal-shop">
                        <SelectValue placeholder="Select shop" />
                      </SelectTrigger>
                      <SelectContent>
                        {shopsList.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Owners and Accountants see the whole partner; a Manager is limited to one shop.
                Cassa cashier PINs are managed in the shop's Staff tab.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editing ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
