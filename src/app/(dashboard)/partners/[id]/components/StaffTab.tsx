import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
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
  PARTNER_USER_ROLES,
  type PartnerUser,
  type PartnerUserRole,
} from "@/lib/api/schemas/partner-users";

interface StaffTabProps {
  partnerId: number;
}

type RoleFilter = "ALL" | PartnerUserRole;

interface StaffFormState {
  name: string;
  phone_number: string;
  mobile_provider: string;
  password: string;
  role: PartnerUserRole;
  shop_id: number | null;
}

const EMPTY_FORM: StaffFormState = {
  name: "",
  phone_number: "",
  mobile_provider: "",
  password: "",
  role: "CASHIER",
  shop_id: null,
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  MANAGER: "secondary",
  CASHIER: "outline",
};

const PAGE_SIZE = 100;

export function StaffTab({ partnerId }: StaffTabProps) {
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [shopFilter, setShopFilter] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerUser | null>(null);
  const [form, setForm] = useState<StaffFormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);

  const { data: shops } = useQuery({
    queryKey: ["shops", partnerId],
    queryFn: () => shopsApi.getByPartner(partnerId),
    enabled: !!partnerId,
  });

  const { data: staffData, isLoading, error } = useQuery({
    queryKey: ["partner-users", partnerId],
    queryFn: () => partnerUsersApi.getAll({ page: 1, limit: PAGE_SIZE }),
    enabled: !!partnerId,
  });

  const allStaff = useMemo(() => staffData?.data ?? [], [staffData]);
  const partnerStaff = useMemo(
    () => allStaff.filter((u) => u.partner_id === partnerId),
    [allStaff, partnerId]
  );

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partnerStaff.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (shopFilter !== "ALL" && u.shop_id !== shopFilter) return false;
      if (q) {
        const name = (u.name ?? "").toLowerCase();
        const phone = u.phone_number.toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [partnerStaff, roleFilter, shopFilter, search]);

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
      toast.success("Staff member created");
      closeDialog();
    },
    onError: () => toast.error("Failed to create staff member"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: { id: number } & Parameters<typeof partnerUsersApi.update>[1]) =>
      partnerUsersApi.update(id, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-users"] });
      toast.success("Staff member updated");
      closeDialog();
    },
    onError: () => toast.error("Failed to update staff member"),
  });

  const deleteMutation = useMutation({
    mutationFn: partnerUsersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-users"] });
      toast.success("Staff member deleted");
    },
    onError: () => toast.error("Failed to delete staff member"),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setIsDialogOpen(true);
  }

  function openEdit(user: PartnerUser) {
    setEditing(user);
    setForm({
      name: user.name ?? "",
      phone_number: user.phone_number,
      mobile_provider: user.mobile_provider ?? "",
      password: "",
      role: (user.role === "MANAGER" || user.role === "CASHIER" ? user.role : "CASHIER") as PartnerUserRole,
      shop_id: user.shop_id ?? null,
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
  }

  function handleShopChange(value: string) {
    setForm((prev) => ({ ...prev, shop_id: Number(value) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.phone_number.trim()) return toast.error("Phone number is required");
    if (!form.shop_id) {
      return toast.error("Shop is required so the user can log in to cassa.hoopla.uz");
    }
    if (!editing && !form.password.trim()) {
      return toast.error("Set a password so the cashier can log in");
    }

    const name = form.name.trim();
    const password = form.password.trim();
    const mobileProvider = form.mobile_provider.trim();

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        partner_id: partnerId,
        shop_id: form.shop_id,
        name: name || undefined,
        phone_number: form.phone_number.trim(),
        mobile_provider: mobileProvider,
        password: password || undefined,
        role: form.role,
      });
    } else {
      createMutation.mutate({
        partner_id: partnerId,
        shop_id: form.shop_id,
        name: name || undefined,
        phone_number: form.phone_number.trim(),
        mobile_provider: mobileProvider,
        password: password || undefined,
        role: form.role,
      });
    }
  }

  function handleDelete(user: PartnerUser) {
    if (!confirm(`Delete ${user.name ?? user.phone_number}?`)) return;
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
              {PARTNER_USER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={shopFilter === "ALL" ? "ALL" : String(shopFilter)}
            onValueChange={(v) => setShopFilter(v === "ALL" ? "ALL" : Number(v))}
          >
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Shop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All shops</SelectItem>
              {shopsList.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone (login)</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Mobile provider</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Loading staff...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-destructive">
                    Failed to load staff
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No staff members
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{user.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANTS[user.role] ?? "outline"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.shop_id
                        ? user.shop?.name ?? shopById.get(user.shop_id) ?? `#${user.shop_id}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.mobile_provider || "-"}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit staff member" : "Add staff member"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update staff details. Leave password blank to keep the current one."
                  : "Phone number is the login for cassa.hoopla.uz."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Name</Label>
                <Input
                  id="staff-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name (optional)"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone number (login)</Label>
                <Input
                  id="staff-phone"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="998XXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  The cashier types this exact value at cassa.hoopla.uz.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-password">
                  {editing ? "New password (leave blank to keep)" : "Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="staff-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? "••••••••" : "Share this with the cashier"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="staff-role">Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as PartnerUserRole })}
                  >
                    <SelectTrigger id="staff-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNER_USER_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-shop">Shop (required)</Label>
                  <Select
                    value={form.shop_id ? String(form.shop_id) : undefined}
                    onValueChange={handleShopChange}
                  >
                    <SelectTrigger id="staff-shop">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-provider">Mobile provider (optional)</Label>
                <Input
                  id="staff-provider"
                  value={form.mobile_provider}
                  onChange={(e) => setForm({ ...form, mobile_provider: e.target.value })}
                  placeholder="Leave blank for cassa cashiers"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editing ? "Save changes" : "Create staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
