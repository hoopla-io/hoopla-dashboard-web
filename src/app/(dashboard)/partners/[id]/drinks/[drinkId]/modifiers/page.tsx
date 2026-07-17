
import { useState, useMemo, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { useQueryState, parseAsInteger } from "nuqs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
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
  isFirst,
  isLast,
  onMove,
  moving,
}: {
  group: ModifierGroup;
  onSave: (d: UpdateModifierGroupRequest) => void;
  saving: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (dir: -1 | 1) => void;
  moving: boolean;
}) {
  const [name, setName] = useState(group.name);
  const [min, setMin] = useState<number>(group.min_select);
  const [max, setMax] = useState<string>(group.max_select == null ? "" : String(group.max_select));

  const maxNorm = group.max_select == null ? "" : String(group.max_select);
  const dirty = name !== group.name || min !== group.min_select || max !== maxNorm;

  return (
    <TableRow>
      <TableCell className="w-[72px]">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isFirst || moving}
            onClick={() => onMove(-1)}
            aria-label={`Move ${group.name} up`}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isLast || moving}
            onClick={() => onMove(1)}
            aria-label={`Move ${group.name} down`}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="font-mono text-[11px] text-muted-foreground">{group.key}</TableCell>
      <TableCell><Input value={name} onChange={(e) => setName(e.target.value)} /></TableCell>
      <TableCell><Input type="number" min={0} className="w-[80px]" value={min} onChange={(e) => setMin(Number(e.target.value))} /></TableCell>
      <TableCell><Input type="number" min={0} className="w-[80px]" placeholder="∞" value={max} onChange={(e) => setMax(e.target.value)} /></TableCell>
      <TableCell className="text-xs text-muted-foreground tabular-nums">{group.option_count}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={() => onSave({ key: group.key, name, min_select: min, max_select: max === "" ? null : Number(max) })}
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

  const reorderMutation = useMutation({
    mutationFn: (keys: string[]) => drinksApi.reorderModifierGroups(partnerDrinkId, keys),
    // Optimistic: apply the new order to the cache immediately so the UI (and any
    // rapid follow-up ↑/↓ click, which recomputes from this cache) always sees the
    // latest order — never a stale pre-reorder snapshot. Roll back on error.
    onMutate: async (keys: string[]) => {
      await queryClient.cancelQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
      const previous = queryClient.getQueryData<ModifierGroup[]>(["modifier_groups", partnerDrinkId]);
      if (previous) {
        const byKey = new Map(previous.map((g) => [g.key, g]));
        const reordered = keys
          .map((k) => byKey.get(k))
          .filter((g): g is ModifierGroup => g !== undefined);
        queryClient.setQueryData(["modifier_groups", partnerDrinkId], reordered);
      }
      return { previous };
    },
    onError: (e: unknown, _keys, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["modifier_groups", partnerDrinkId], context.previous);
      }
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to reorder groups");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
    },
  });

  // Swap a group with its neighbour and persist the whole new key order. The
  // server assigns sort_order by array position; the query refetches in the new
  // order on success.
  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= groups.length) return;
    const keys = groups.map((g) => g.key);
    [keys[index], keys[next]] = [keys[next], keys[index]];
    reorderMutation.mutate(keys);
  };

  if (!isLoading && groups.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier Groups</CardTitle>
        <p className="text-sm text-muted-foreground">
          Reorder groups with the arrows (top = shown first in the app), and set each group&apos;s display name and how
          many options a customer must (Min) and may (Max, blank = unlimited) choose.
        </p>
      </CardHeader>
      <CardContent>
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Order</TableHead>
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
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
              ) : (
                groups.map((g, i) => (
                  <GroupRow
                    key={g.key}
                    group={g}
                    saving={updateMutation.isPending}
                    onSave={(d) => updateMutation.mutate(d)}
                    isFirst={i === 0}
                    isLast={i === groups.length - 1}
                    onMove={(dir) => move(i, dir)}
                    moving={reorderMutation.isPending}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </DataTableShell>
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

  // Suggestions for the (free-text) Vendor Addon Key: a few common defaults plus
  // every key already used on this drink. The field is NOT limited to these — type
  // any new key (e.g. "topic") to create a new modifier group on the fly.
  const addonKeySuggestions = useMemo(() => {
    const defaults = ["sugar", "size", "syrup", "milk"];
    const used = modifiers.map((m) => m.vendor_addon_key).filter((k): k is string => !!k);
    return Array.from(new Set([...defaults, ...used]));
  }, [modifiers]);

  // Convenience default for Vendor Group ID: next integer after the highest
  // existing numeric group id (editable). Vendor Addon ID stays manual.
  const nextVendorGroupId = useMemo(() => {
    const nums = modifiers
      .map((m) => parseInt(m.vendor_group_id ?? "", 10))
      .filter((n) => Number.isFinite(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return String(max + 1);
  }, [modifiers]);

  const nextVendorAddonId = useMemo(() => {
    const nums = modifiers
      .map((m) => parseInt(m.vendor_addon_id ?? "", 10))
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
    if (modifiers.some((m) => (m.vendor_addon_id ?? "") === addForm.vendor_addon_id)) {
      toast.error(`Vendor Addon ID "${addForm.vendor_addon_id}" is already used on this drink. Each option needs a unique ID.`);
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
    if (modifiers.some((m) => m.id !== editingModifier.id && (m.vendor_addon_id ?? "") === editForm.vendor_addon_id)) {
      toast.error(`Vendor Addon ID "${editForm.vendor_addon_id}" is already used on this drink. Each option needs a unique ID.`);
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
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Addon Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Vendor Addon ID</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
                ) : modifiers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="p-0">
                    <EmptyState
                      title="No addons found"
                      description="Add an addon to get started."
                    />
                  </TableCell></TableRow>
                ) : (
                  modifiers.map((mod) => (
                    <TableRow key={mod.id}>
                      <TableCell className="font-medium">{mod.vendor_addon_name}</TableCell>
                      <TableCell>
                        {mod.vendor_addon_key ? (
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px]">{mod.vendor_addon_key}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">— ungrouped</span>
                        )}
                      </TableCell>
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
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              perPage={perPage}
              onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
              isLoading={isLoading}
            />
          </DataTableShell>
        </CardContent>
      </Card>

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
                placeholder={`Unique per drink — e.g. ${nextVendorAddonId}`}
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
                <Input
                  id="add_vendor_addon_key"
                  list="add-addon-key-suggestions"
                  value={addForm.vendor_addon_key || ""}
                  onChange={(e) => setAddForm({ ...addForm, vendor_addon_key: e.target.value })}
                  placeholder="e.g. topic, sugar, size…"
                />
                <datalist id="add-addon-key-suggestions">
                  {addonKeySuggestions.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
                <p className="text-[11px] text-muted-foreground">
                  Addons sharing a key form one modifier group. Type a new key to create a new group.
                </p>
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
                <Input
                  id="edit_vendor_addon_key"
                  list="edit-addon-key-suggestions"
                  value={editForm.vendor_addon_key || ""}
                  onChange={(e) => setEditForm({ ...editForm, vendor_addon_key: e.target.value })}
                  placeholder="e.g. topic, sugar, size…"
                />
                <datalist id="edit-addon-key-suggestions">
                  {addonKeySuggestions.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
                <p className="text-[11px] text-muted-foreground">
                  Addons sharing a key form one modifier group. Type a new key to create a new group.
                </p>
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
