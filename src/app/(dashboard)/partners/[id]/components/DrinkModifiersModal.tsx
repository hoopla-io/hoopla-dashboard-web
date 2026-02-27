import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { drinksApi } from "@/lib/api/domains/drinks";
import type { CreatePartnerDrinkModifierRequest, PartnerDrinkModifier, UpdatePartnerDrinkModifierRequest } from "@/lib/api/schemas/drinks";

interface DrinkModifiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: number;
  drinkId: number;
  drinkName: string;
}

export function DrinkModifiersModal({ isOpen, onClose, partnerId, drinkId, drinkName }: DrinkModifiersModalProps) {
  const queryClient = useQueryClient();
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

  const { data: allModifiers, isLoading } = useQuery({
    queryKey: ["partner_drink_modifiers", partnerId],
    queryFn: () => drinksApi.listModifiersByPartner(partnerId),
    enabled: isOpen && !!partnerId,
  });

  const modifiers = allModifiers?.filter((m) => m.drink_id === drinkId) || [];

  const createMutation = useMutation({
    mutationFn: (data: CreatePartnerDrinkModifierRequest) => drinksApi.createModifier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerId] });
      toast.success("Addon created successfully");
      setIsFormOpen(false);
    },
    onError: () => toast.error("Failed to create addon"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePartnerDrinkModifierRequest }) =>
      drinksApi.updateModifier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerId] });
      toast.success("Addon updated successfully");
      setIsFormOpen(false);
    },
    onError: () => toast.error("Failed to update addon"),
  });

  const deleteMutation = useMutation({
    mutationFn: drinksApi.deleteModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drink_modifiers", partnerId] });
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
      vendor_addon_id: mod.vendor_addon_id || "",
      vendor_addon_key: mod.vendor_addon_key || "",
      vendor_addon_name: mod.vendor_addon_name || "",
      vendor_addon_price: mod.vendor_addon_price || 0,
      vendor_group_id: mod.vendor_group_id || "",
    });
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="max-w-3xl">
        {!isFormOpen ? (
          <>
            <DialogHeader>
              <div className="flex justify-between items-center pr-6">
                <div>
                  <DialogTitle>Addons for {drinkName}</DialogTitle>
                  <DialogDescription>Manage modifiers/addons for this specific drink</DialogDescription>
                </div>
                <Button onClick={openCreateForm} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Addon
                </Button>
              </div>
            </DialogHeader>
            <div className="py-4">
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
                        <TableCell>{mod.vendor_addon_price?.toLocaleString() || "0"}</TableCell>
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
            </div>
            <DialogFooter>
              <Button onClick={handleClose} variant="outline">Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>{editingModifierId ? "Edit Addon" : "New Addon"}</DialogTitle>
                  <DialogDescription>{editingModifierId ? "Update addon details" : "Add a new addon to this drink"}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-4 py-4">
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
                    value={formData.vendor_addon_price || ""}
                    onChange={(e) => setFormData({ ...formData, vendor_addon_price: parseFloat(e.target.value) || 0 })}
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
                        <SelectItem value="syrop">syrop</SelectItem>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Addon"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
