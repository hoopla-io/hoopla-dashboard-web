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
  PARTNER_USER_ROLES,
  type PartnerUser,
  type PartnerUserRole,
} from "@/lib/api/schemas/partner-users";

interface StaffTabProps {
  shopId: number;
}

type RoleFilter = "ALL" | PartnerUserRole;

interface StaffFormState {
  name: string;
  role: PartnerUserRole;
  vendor_pin: string;
}

const EMPTY_FORM: StaffFormState = {
  name: "",
  role: "CASHIER",
  vendor_pin: "",
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  MANAGER: "secondary",
  CASHIER: "outline",
};

const PAGE_SIZE = 500;

export function StaffTab({ shopId }: StaffTabProps) {
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerUser | null>(null);
  const [form, setForm] = useState<StaffFormState>(EMPTY_FORM);

  const { data: shop } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => shopsApi.getById(shopId),
    enabled: !!shopId,
  });

  const partnerId = shop?.partner?.id;

  const { data: staffData, isLoading, error } = useQuery({
    // Scope to the shop's partner so a shop's cashiers don't fall off page 1
    // once platform-wide partner_users exceed the 100-row cap.
    queryKey: ["partner-users", "shop", shopId, partnerId],
    queryFn: () => partnerUsersApi.getAll({ page: 1, limit: PAGE_SIZE, partner_id: partnerId }),
    enabled: !!shopId && !!partnerId,
  });

  const allStaff = useMemo(() => staffData?.data ?? [], [staffData]);
  const shopStaff = useMemo(
    () => allStaff.filter((u) => u.shop_id === shopId || u.shop?.id === shopId),
    [allStaff, shopId]
  );

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shopStaff.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (q) {
        const name = (u.name ?? "").toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [shopStaff, roleFilter, search]);

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
    setIsDialogOpen(true);
  }

  function openEdit(user: PartnerUser) {
    setEditing(user);
    setForm({
      name: user.name ?? "",
      role: (user.role === "MANAGER" || user.role === "CASHIER" ? user.role : "CASHIER") as PartnerUserRole,
      vendor_pin: "",
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

    if (!partnerId) {
      return toast.error("Shop is missing a partner — cannot create staff");
    }

    const name = form.name.trim();
    const vendorPin = form.vendor_pin.trim();
    if (vendorPin && !/^\d{4}$/.test(vendorPin)) {
      return toast.error("PIN must be exactly 4 digits");
    }

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        partner_id: partnerId,
        shop_id: shopId,
        name: name || undefined,
        role: form.role,
        vendor_pin: vendorPin || undefined,
      });
    } else {
      createMutation.mutate({
        partner_id: partnerId,
        shop_id: shopId,
        name: name || undefined,
        role: form.role,
        vendor_pin: vendorPin || undefined,
      });
    }
  }

  function handleDelete(user: PartnerUser) {
    if (!confirm(`Delete ${user.name ?? `#${user.id}`}?`)) return;
    deleteMutation.mutate(user.id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Search by name"
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
        </div>
        <Button onClick={openCreate} disabled={!partnerId}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                      Loading staff...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-destructive">
                      Failed to load staff
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="p-0">
                      <EmptyState
                        title="No staff members"
                        description="Staff added for this shop will appear here."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANTS[user.role] ?? "outline"}>{user.role}</Badge>
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
          </DataTableShell>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit staff member" : "Add staff member"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update staff details. Leave PIN blank to keep the current one."
                  : `Cashier will be attached to ${shop?.name ?? "this shop"} and signs in with the 4-digit PIN.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shop-staff-name">Name</Label>
                <Input
                  id="shop-staff-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name (optional)"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-staff-role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as PartnerUserRole })}
                >
                  <SelectTrigger id="shop-staff-role">
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

              {(form.role === "CASHIER" || form.role === "MANAGER") && (
                <div className="space-y-2">
                  <Label htmlFor="shop-staff-pin">Cassa PIN (4 digits)</Label>
                  <Input
                    id="shop-staff-pin"
                    value={form.vendor_pin}
                    onChange={(e) =>
                      setForm({ ...form, vendor_pin: e.target.value.replace(/\D/g, "").slice(0, 4) })
                    }
                    placeholder={editing ? "Leave blank to keep" : "e.g. 1234"}
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cashier types this after picking themselves on cassa.hoopla.uz.
                  </p>
                </div>
              )}
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
