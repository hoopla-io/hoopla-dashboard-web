"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { drinksApi } from "@/lib/api/domains/drinks";
import type { CreatePartnerDrinkModifierRequest, PartnerDrinkModifier, UpdatePartnerDrinkModifierRequest } from "@/lib/api/schemas/drinks";

function ModifiersContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const partnerId = Number(params.id);
  const drinkId = Number(params.drinkId);
  const drinkName = searchParams.get("drinkName") || "Drink";

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModifierId, setEditingModifierId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreatePartnerDrinkModifierRequest>({
    drink_id: drinkId,
    partner_id: partnerId,
    vendor_addon_id: "",
    vendor_addon_key: "",
    vendor_addon_name: "",
    vendor_addon_price: 0,
    vendor_group_id: "",
  });

  const { data: modifiersData, isLoading } = useQuery({
    queryKey: ["partner_drink_modifiers", partnerId, drinkId, currentPage, perPage],
    queryFn: () => drinksApi.listModifiersByPartnerAndDrink(partnerId, drinkId, { page: currentPage, limit: perPage }),
    enabled: !!partnerId && !!drinkId,
  });

  const modifiers = modifiersData?.data || [];
  const meta = modifiersData?.meta;
  const totalPages = meta?.totalPages || 1;

  const createMutation = useMutation({
    mutationFn: (data: CreatePartnerDrinkModifierRequest) => drinksApi.createModifier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerId, drinkId] });
      toast.success("Addon created successfully");
      setIsFormOpen(false);
    },
    onError: () => toast.error("Failed to create addon"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePartnerDrinkModifierRequest }) =>
      drinksApi.updateModifier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerId, drinkId] });
      toast.success("Addon updated successfully");
      setIsFormOpen(false);
    },
    onError: () => toast.error("Failed to update addon"),
  });

  const deleteMutation = useMutation({
    mutationFn: drinksApi.deleteModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerId, drinkId] });
      toast.success("Addon deleted successfully");
    },
    onError: () => toast.error("Failed to delete addon"),
  });

  const handleSave = () => {
    if (!formData.vendor_addon_name || !formData.vendor_addon_id) {
      toast.error("Addon Name and Vendor Addon ID are required");
      return;
    }

    if (editingModifierId) {
      const updateData = { ...formData };
      updateMutation.mutate({ id: editingModifierId, data: updateData });
    } else {
      createMutation.mutate({ ...formData, drink_id: drinkId, partner_id: partnerId });
    }
  };

  const openCreateForm = () => {
    setEditingModifierId(null);
    setFormData({
      drink_id: drinkId,
      partner_id: partnerId,
      vendor_addon_id: "",
      vendor_addon_key: "",
      vendor_addon_name: "",
      vendor_addon_price: 0,
      vendor_group_id: "",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (mod: PartnerDrinkModifier) => {
    setEditingModifierId(mod.id);
    setFormData({
      drink_id: drinkId,
      partner_id: partnerId,
      vendor_addon_id: mod.vendor_addon_id ?? "",
      vendor_addon_key: mod.vendor_addon_key ?? "",
      vendor_addon_name: mod.vendor_addon_name ?? "",
      vendor_addon_price: mod.vendor_addon_price ?? 0,
      vendor_group_id: mod.vendor_group_id ?? "",
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/partners/${partnerId}?tab=drinks`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Addons for {drinkName}</h1>
          <p className="text-sm text-muted-foreground">Manage modifiers/addons for this drink</p>
        </div>
      </div>

      {!isFormOpen ? (
        <>
          <div className="flex justify-end">
            <Button onClick={openCreateForm}>
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
                        <TableCell>{mod.vendor_addon_price?.toLocaleString() ?? "0"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditForm(mod)}
                            >
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
            onPerPageChange={(v) => {
              setPerPage(v);
              setCurrentPage(1);
            }}
            isLoading={isLoading}
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>{editingModifierId ? "Edit Addon" : "New Addon"}</CardTitle>
                <p className="text-sm text-muted-foreground">{editingModifierId ? "Update addon details" : "Add a new addon to this drink"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor_addon_name">Addon Name</Label>
                  <Input
                    id="vendor_addon_name"
                    value={formData.vendor_addon_name}
                    onChange={(e) => setFormData({ ...formData, vendor_addon_name: e.target.value })}
                    placeholder="e.g. Extra Sugar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor_addon_id">Vendor Addon ID</Label>
                  <Input
                    id="vendor_addon_id"
                    value={formData.vendor_addon_id}
                    onChange={(e) => setFormData({ ...formData, vendor_addon_id: e.target.value })}
                    placeholder="ID in the vendor's system"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor_addon_price">Addon Price</Label>
                  <Input
                    id="vendor_addon_price"
                    type="number"
                    value={formData.vendor_addon_price}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, vendor_addon_price: val === "" ? 0 : parseFloat(val) });
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor_addon_key">Vendor Addon Key (Optional)</Label>
                    <Select
                      value={formData.vendor_addon_key || undefined}
                      onValueChange={(val) => setFormData({ ...formData, vendor_addon_key: val })}
                    >
                      <SelectTrigger id="vendor_addon_key">
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
                    <Label htmlFor="vendor_group_id">Vendor Group ID (Optional)</Label>
                    <Input
                      id="vendor_group_id"
                      value={formData.vendor_group_id || ""}
                      onChange={(e) => setFormData({ ...formData, vendor_group_id: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Addon"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
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
