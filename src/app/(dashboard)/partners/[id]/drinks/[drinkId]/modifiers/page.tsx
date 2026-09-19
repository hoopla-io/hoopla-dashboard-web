
import { useState, useMemo, Suspense, type ComponentProps, type ReactNode } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
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
import { useConfirm } from "@/hooks/use-confirm";
import { drinksApi } from "@/lib/api/domains/drinks";
import { formatUZS } from "@/lib/money";
import { ReorderControls } from "@/app/(dashboard)/partners/[id]/components/ReorderControls";
import type { PaginatedResponse } from "@/lib/api/types";
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
  onDelete,
  saving,
  deleting,
  controls,
  rowProps,
}: {
  group: ModifierGroup;
  onSave: (d: UpdateModifierGroupRequest) => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
  controls: ReactNode;
  rowProps: ComponentProps<typeof TableRow>;
}) {
  const [name, setName] = useState(group.name);
  const [min, setMin] = useState<number>(group.min_select);
  const [max, setMax] = useState<string>(group.max_select == null ? "" : String(group.max_select));

  const maxNorm = group.max_select == null ? "" : String(group.max_select);
  const dirty = name !== group.name || min !== group.min_select || max !== maxNorm;

  return (
    <TableRow {...rowProps}>
      <TableCell className="px-2">{controls}</TableCell>
      <TableCell className="font-mono text-[11px] text-muted-foreground">{group.key}</TableCell>
      <TableCell><Input value={name} onChange={(e) => setName(e.target.value)} /></TableCell>
      <TableCell><Input type="number" min={0} className="w-[80px]" value={min} onChange={(e) => setMin(Number(e.target.value))} /></TableCell>
      <TableCell><Input type="number" min={0} className="w-[80px]" placeholder="∞" value={max} onChange={(e) => setMax(e.target.value)} /></TableCell>
      <TableCell className="text-xs text-muted-foreground tabular-nums">{group.option_count}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            disabled={!dirty || saving}
            onClick={() => onSave({ key: group.key, name, min_select: min, max_select: max === "" ? null : Number(max) })}
          >
            Save
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={deleting}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ModifierGroupsCard({ partnerDrinkId }: { partnerDrinkId: number }) {
  const queryClient = useQueryClient();
  const confirmDelete = useConfirm();
  const [draggedGroupId, setDraggedGroupId] = useState<number | null>(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => drinksApi.deleteModifierGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
      toast.success("Modifier group deleted");
    },
    onError: (e: unknown) =>
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete group"),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedGroups: ModifierGroup[]) =>
      drinksApi.reorderModifierGroups({
        partner_drink_id: partnerDrinkId,
        modifier_group_ids: orderedGroups.map((group) => group.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
    },
  });

  const moveGroup = (fromIndex: number, toIndex: number) => {
    if (
      reorderMutation.isPending ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= groups.length ||
      toIndex >= groups.length
    ) return;

    const reordered = [...groups];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    queryClient.setQueryData<ModifierGroup[]>(["modifier_groups", partnerDrinkId], reordered);

    reorderMutation.mutate(reordered, {
      onError: () => {
        queryClient.setQueryData<ModifierGroup[]>(["modifier_groups", partnerDrinkId], groups);
        queryClient.invalidateQueries({ queryKey: ["modifier_groups", partnerDrinkId] });
        toast.error("Failed to save group order");
      },
    });
  };

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
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><span className="sr-only">Reorder</span></TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Display name</TableHead>
                <TableHead className="w-[90px]">Min</TableHead>
                <TableHead className="w-[90px]">Max</TableHead>
                <TableHead className="w-[80px]">Options</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
              ) : (
                groups.map((g, index) => (
                  <GroupRow
                    key={g.id}
                    group={g}
                    saving={updateMutation.isPending}
                    deleting={deleteMutation.isPending}
                    onSave={(d) => updateMutation.mutate(d)}
                    onDelete={async () => {
                      const confirmed = await confirmDelete({
                        title: "Delete modifier group?",
                        description: `"${g.name || g.key}" and its ${g.option_count} option(s) will be removed from this product.`,
                      });
                      if (confirmed) deleteMutation.mutate(g.id);
                    }}
                    rowProps={{
                      onDragOver: (event) => {
                        if (draggedGroupId !== null && !reorderMutation.isPending) event.preventDefault();
                      },
                      onDrop: (event) => {
                        event.preventDefault();
                        moveGroup(groups.findIndex((group) => group.id === draggedGroupId), index);
                        setDraggedGroupId(null);
                      },
                      className: draggedGroupId === g.id ? "opacity-50" : undefined,
                    }}
                    controls={
                      <ReorderControls
                        label={g.name || g.key}
                        disabled={reorderMutation.isPending}
                        canMoveUp={index > 0}
                        canMoveDown={index < groups.length - 1}
                        onMoveUp={() => moveGroup(index, index - 1)}
                        onMoveDown={() => moveGroup(index, index + 1)}
                        onDragStart={() => setDraggedGroupId(g.id)}
                        onDragEnd={() => setDraggedGroupId(null)}
                      />
                    }
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
  const drinkName = searchParams.get("productName") || searchParams.get("drinkName") || "Product";

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(100));

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingModifier, setEditingModifier] = useState<PartnerDrinkModifier | null>(null);
  const [draggedModifierId, setDraggedModifierId] = useState<number | null>(null);

  const [addForm, setAddForm] = useState<CreatePartnerDrinkModifierRequest>(() => EMPTY_FORM(partnerDrinkId));
  const [editForm, setEditForm] = useState<Partial<UpdatePartnerDrinkModifierRequest>>({});

  const modifiersQueryKey = ["partner_drink_modifiers", partnerDrinkId, currentPage, perPage];

  const { data: modifiersData, isLoading } = useQuery({
    queryKey: modifiersQueryKey,
    queryFn: () => drinksApi.listModifiers(partnerDrinkId, { page: currentPage, limit: perPage }),
    enabled: !!partnerDrinkId,
  });

  const modifiers = useMemo(() => modifiersData?.data || [], [modifiersData]);
  const meta = modifiersData?.meta;
  const totalPages = meta?.totalPages || 1;
  const isModifierReorderDisabled = totalPages > 1;
  const draggedModifier = modifiers.find((modifier) => modifier.id === draggedModifierId);

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

  const reorderModifiersMutation = useMutation({
    mutationFn: ({ groupId, orderedModifiers }: { groupId: number; orderedModifiers: PartnerDrinkModifier[] }) =>
      drinksApi.reorderModifiers({
        modifier_group_id: groupId,
        modifier_ids: orderedModifiers
          .filter((modifier) => modifier.modifier_group_id === groupId)
          .map((modifier) => modifier.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
    },
  });

  const moveModifier = (fromIndex: number, toIndex: number) => {
    if (
      isModifierReorderDisabled ||
      reorderModifiersMutation.isPending ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= modifiers.length ||
      toIndex >= modifiers.length ||
      modifiers[fromIndex].modifier_group_id !== modifiers[toIndex].modifier_group_id
    ) return;

    const reordered = [...modifiers];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    queryClient.setQueryData<PaginatedResponse<PartnerDrinkModifier>>(
      modifiersQueryKey,
      (current) => current && { ...current, data: reordered }
    );

    reorderModifiersMutation.mutate({ groupId: moved.modifier_group_id, orderedModifiers: reordered }, {
      onError: () => {
        queryClient.setQueryData(modifiersQueryKey, modifiersData);
        queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerDrinkId] });
        toast.error("Failed to save addon order");
      },
    });
  };

  const confirmDelete = useConfirm();

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
      toast.error(`Vendor Addon ID "${addForm.vendor_addon_id}" is already used on this product. Each option needs a unique ID.`);
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
      toast.error(`Vendor Addon ID "${editForm.vendor_addon_id}" is already used on this product. Each option needs a unique ID.`);
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
        <Button variant="ghost" size="icon" onClick={() => navigate(`/partners/${partnerId}?tab=products`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Addons for {drinkName}</h1>
          <p className="text-sm text-muted-foreground">Manage modifiers/addons for this product</p>
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
                  <TableHead className="w-10"><span className="sr-only">Reorder</span></TableHead>
                  <TableHead>Addon Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Vendor Addon ID</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>
                ) : modifiers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="p-0">
                    <EmptyState
                      title="No addons found"
                      description="Add an addon to get started."
                    />
                  </TableCell></TableRow>
                ) : (
                  modifiers.map((mod, index) => (
                    <TableRow
                      key={mod.id}
                      onDragOver={(event) => {
                        if (draggedModifier?.modifier_group_id === mod.modifier_group_id && !reorderModifiersMutation.isPending) event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        moveModifier(modifiers.findIndex((modifier) => modifier.id === draggedModifierId), index);
                        setDraggedModifierId(null);
                      }}
                      className={draggedModifierId === mod.id ? "opacity-50" : undefined}
                    >
                      <TableCell className="px-2">
                        <ReorderControls
                          label={mod.vendor_addon_name || "addon"}
                          disabled={isModifierReorderDisabled || reorderModifiersMutation.isPending}
                          disabledReason={isModifierReorderDisabled ? "Show all addons on one page to reorder" : undefined}
                          canMoveUp={index > 0 && modifiers[index - 1].modifier_group_id === mod.modifier_group_id}
                          canMoveDown={index < modifiers.length - 1 && modifiers[index + 1].modifier_group_id === mod.modifier_group_id}
                          onMoveUp={() => moveModifier(index, index - 1)}
                          onMoveDown={() => moveModifier(index, index + 1)}
                          onDragStart={() => setDraggedModifierId(mod.id)}
                          onDragEnd={() => setDraggedModifierId(null)}
                        />
                      </TableCell>
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
                            onClick={async () => { if (await confirmDelete({ title: "Delete modifier?" })) deleteMutation.mutate(mod.id); }}
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
                placeholder={`Unique per product — e.g. ${nextVendorAddonId}`}
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
