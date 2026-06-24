
import { useState, useMemo, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useQueryState, parseAsInteger } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { drinksApi } from "@/lib/api/domains/drinks";
import { formatUZS } from "@/lib/money";
import type { CreatePartnerDrinkModifierRequest, PartnerDrinkModifier, UpdatePartnerDrinkModifierRequest, ModifierGroup, UpdateModifierGroupRequest } from "@/lib/api/schemas/drinks";

const EMPTY_FORM = (partnerDrinkId: number): CreatePartnerDrinkModifierRequest => ({
  partner_drink_id: partnerDrinkId,
  vendor_addon_id: "",
  vendor_addon_key: "",
  vendor_addon_name: "",
  vendor_addon_price: 0,
  vendor_group_id: "",
});

function GroupRow({
  group,
  onSave,
  saving,
}: {
  group: ModifierGroup;
  onSave: (d: UpdateModifierGroupRequest) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(group.name);
  const [min, setMin] = useState<number>(group.min_select);
  const [max, setMax] = useState<string>(group.max_select == null ? "" : String(group.max_select));

  const maxNorm = group.max_select == null ? "" : String(group.max_select);
  const dirty = name !== group.name || min !== group.min_select || max !== maxNorm;

  return (
    <TableRow>
      <TableCell className="font-mono text-[11px] text-muted-foreground">{group.vendor_group_id}</TableCell>
      <TableCell><Input value={name} onChange={(e) => setName(e.target.value)} /></TableCell>
      <TableCell><Input type="number" min={0} className="w-[80px]" value={min} onChange={(e) => setMin(Number(e.target.value))} /></TableCell>
      <TableCell><Input type="number" min={0} className="w-[80px]" placeholder="∞" value={max} onChange={(e) => setMax(e.target.value)} /></TableCell>
      <TableCell className="text-xs text-muted-foreground tabular-nums">{group.option_count}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={() => onSave({ vendor_group_id: group.vendor_group_id, name, min_select: min, max_select: max === "" ? null : Number(max) })}
        >
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ModifierGroupsCard({ partnerDrinkId }: { partnerDrinkId: number }) {
  const queryClient = useQueryClient();
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["modifier_groups", partnerDrinkId],
    queryFn: () => drinksApi.listModifierGroups(partnerDrinkId),
  });
  const updateMutation = useMutation({
    mutationFn: (data: UpdateModifierGroupRequest) => drinksApi.updateModifierGroup(partnerDrinkId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
      toast.success("Modifier group updated");
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update group"),
  });

  if (!isLoading && groups.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier Groups</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set each group&apos;s display name and how many options a customer must (Min) and may (Max, blank = unlimited) choose.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Display name</TableHead>
              <TableHead className="w-[90px]">Min</TableHead>
              <TableHead className="w-[90px]">Max</TableHead>
              <TableHead className="w-[80px]">Options</TableHead>
              <TableHead className="text-right">Save</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : (
              groups.map((g) => (
                <GroupRow key={g.vendor_group_id} group={g} saving={updateMutation.isPending} onSave={(d) => updateMutation.mutate(d)} />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ModifiersContent() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const partnerId = Number(params.id);
  const partnerDrinkId = Number(params.drinkId);
  const drinkName = searchParams.get("drinkName") || "Drink";

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<PartnerDrinkModifier | null>(null);

  const [addForm, setAddForm] = useState<CreatePartnerDrinkModifierRequest>(() => EMPTY_FORM(partnerDrinkId));
  const [editForm, setEditForm] = useState<Partial<UpdatePartnerDrinkModifierRequest>>({});

  const { data: modifiersData, isLoading } = useQuery({
    queryKey: ["partner_drink_modifiers", partnerDrinkId, currentPage, perPage],
    queryFn: () => drinksApi.listModifiers(partnerDrinkId, { page: currentPage, limit: perPage }),
    enabled: !!partnerDrinkId,
  });

  const modifiers = useMemo(() => modifiersData?.data || [], [modifiersData]);
  const meta = modifiersData?.meta;
  const totalPages = meta?.totalPages || 1;

  // Convenience default for Vendor Group ID: next integer after the highest
  // existing numeric group id (editable). Vendor Addon ID stays manual.
  const nextVendorGroupId = useMemo(() => {
    const nums = modifiers
      .map((m) => parseInt(m.vendor_group_id ?? "", 10))
      .filter((n) => Number.isFinite(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return String(max + 1);
  }, [modifiers]);

  const createMutation = useMutation({
    mutationFn: (data: CreatePartnerDrinkModifierRequest) => drinksApi.createModifier(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
      toast.success("Addon created successfully");
      // Keep the modal open and pre-fill the next Vendor Group ID (prev + 1).
      const nextGroupId = String((parseInt(variables.vendor_group_id ?? "", 10) || 0) + 1);
      setAddForm({ ...EMPTY_FORM(partnerDrinkId), vendor_group_id: nextGroupId });
    },
    onError: () => toast.error("Failed to create addon"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePartnerDrinkModifierRequest }) =>
      drinksApi.updateModifier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
      toast.success("Addon updated successfully");
      setEditingModifier(null);
    },
    onError: () => toast.error("Failed to update addon"),
  });

  const deleteMutation = useMutation({
    mutationFn: drinksApi.deleteModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
      toast.success("Addon deleted successfully");
    },
    onError: () => toast.error("Failed to delete addon"),
  });

  const handleCreate = () => {
    if (!addForm.vendor_addon_name || !addForm.vendor_addon_id) {
      toast.error("Addon Name and Vendor Addon ID are required");
      return;
    }
    createMutation.mutate({ ...addForm, partner_drink_id: partnerDrinkId });
  };

  const handleUpdate = () => {
    if (!editingModifier) return;
    if (!editForm.vendor_addon_name || !editForm.vendor_addon_id) {
      toast.error("Addon Name and Vendor Addon ID are required");
      return;
    }
    updateMutation.mutate({ id: editingModifier.id, data: editForm as UpdatePartnerDrinkModifierRequest });
  };

  const openEditModal = (mod: PartnerDrinkModifier) => {
    setEditingModifier(mod);
    setEditForm({
      vendor_addon_id: mod.vendor_addon_id ?? "",
      vendor_addon_key: mod.vendor_addon_key ?? "",
      vendor_addon_name: mod.vendor_addon_name ?? "",
      vendor_addon_price: mod.vendor_addon_price ?? 0,
      vendor_group_id: mod.vendor_group_id ?? "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/partners/${partnerId}?tab=drinks`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Addons for {drinkName}</h1>
          <p className="text-sm text-muted-foreground">Manage modifiers/addons for this drink</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setAddForm({ ...EMPTY_FORM(partnerDrinkId), vendor_group_id: nextVendorGroupId }); setAddModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Addon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Addons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Addon Name</TableHead>
                <TableHead>Vendor Addon ID</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4">Loading addons...</TableCell></TableRow>
              ) : modifiers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No addons found</TableCell></TableRow>
              ) : (
                modifiers.map((mod) => (
                  <TableRow key={mod.id}>
                    <TableCell className="font-medium">{mod.vendor_addon_name}</TableCell>
                    <TableCell>{mod.vendor_addon_id}</TableCell>
                    <TableCell>{formatUZS(mod.vendor_addon_price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(mod)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(mod.id)}
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
        </CardContent>
      </Card>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        perPage={perPage}
        onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
        isLoading={isLoading}
      />

      <div className="mt-6">
        <ModifierGroupsCard partnerDrinkId={partnerDrinkId} />
      </div>

      {/* Add Addon Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Addon</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="add_vendor_addon_name">Addon Name</Label>
              <Input
                id="add_vendor_addon_name"
                value={addForm.vendor_addon_name}
                onChange={(e) => setAddForm({ ...addForm, vendor_addon_name: e.target.value })}
                placeholder="e.g. Extra Sugar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_vendor_addon_id">Vendor Addon ID</Label>
              <Input
                id="add_vendor_addon_id"
                value={addForm.vendor_addon_id}
                onChange={(e) => setAddForm({ ...addForm, vendor_addon_id: e.target.value })}
                placeholder="ID in the vendor's system"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_vendor_addon_price">Addon Price</Label>
              <Input
                id="add_vendor_addon_price"
                type="number"
                value={addForm.vendor_addon_price}
                onChange={(e) => {
                  const val = e.target.value;
                  setAddForm({ ...addForm, vendor_addon_price: val === "" ? 0 : parseFloat(val) });
                }}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add_vendor_addon_key">Vendor Addon Key (Optional)</Label>
                <Select
                  value={addForm.vendor_addon_key || undefined}
                  onValueChange={(val) => setAddForm({ ...addForm, vendor_addon_key: val })}
                >
                  <SelectTrigger id="add_vendor_addon_key">
                    <SelectValue placeholder="Select a key" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sugar">sugar</SelectItem>
                    <SelectItem value="size">size</SelectItem>
                    <SelectItem value="syrup">syrup</SelectItem>
                    <SelectItem value="milk">milk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_vendor_group_id">Vendor Group ID (Optional)</Label>
                <Input
                  id="add_vendor_group_id"
                  value={addForm.vendor_group_id || ""}
                  onChange={(e) => setAddForm({ ...addForm, vendor_group_id: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Addon"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Addon Modal */}
      <Dialog open={!!editingModifier} onOpenChange={(open) => { if (!open) setEditingModifier(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Addon</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit_vendor_addon_name">Addon Name</Label>
              <Input
                id="edit_vendor_addon_name"
                value={editForm.vendor_addon_name ?? ""}
                onChange={(e) => setEditForm({ ...editForm, vendor_addon_name: e.target.value })}
                placeholder="e.g. Extra Sugar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_vendor_addon_id">Vendor Addon ID</Label>
              <Input
                id="edit_vendor_addon_id"
                value={editForm.vendor_addon_id ?? ""}
                onChange={(e) => setEditForm({ ...editForm, vendor_addon_id: e.target.value })}
                placeholder="ID in the vendor's system"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_vendor_addon_price">Addon Price</Label>
              <Input
                id="edit_vendor_addon_price"
                type="number"
                value={editForm.vendor_addon_price ?? 0}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditForm({ ...editForm, vendor_addon_price: val === "" ? 0 : parseFloat(val) });
                }}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit_vendor_addon_key">Vendor Addon Key (Optional)</Label>
                <Select
                  value={editForm.vendor_addon_key || undefined}
                  onValueChange={(val) => setEditForm({ ...editForm, vendor_addon_key: val })}
                >
                  <SelectTrigger id="edit_vendor_addon_key">
                    <SelectValue placeholder="Select a key" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sugar">sugar</SelectItem>
                    <SelectItem value="size">size</SelectItem>
                    <SelectItem value="syrup">syrup</SelectItem>
                    <SelectItem value="milk">milk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_vendor_group_id">Vendor Group ID (Optional)</Label>
                <Input
                  id="edit_vendor_group_id"
                  value={editForm.vendor_group_id ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, vendor_group_id: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingModifier(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DrinkModifiersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading modifiers...</div>}>
      <ModifiersContent />
    </Suspense>
  );
}
