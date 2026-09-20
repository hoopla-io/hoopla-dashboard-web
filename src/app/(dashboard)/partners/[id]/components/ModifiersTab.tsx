import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { partnersApi } from "@/lib/api/domains/partners";
import { getApiErrorMessage } from "@/lib/api/error";
import type { PartnerModifier } from "@/lib/api/schemas/partners";

interface ModifiersTabProps {
  partnerId: number;
}

export function ModifiersTab({ partnerId }: ModifiersTabProps) {
  const queryClient = useQueryClient();
  const confirmDelete = useConfirm();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerModifier | null>(null);
  const [name, setName] = useState("");

  const { data: modifiersRaw, isLoading } = useQuery({
    queryKey: ["partner_modifiers", partnerId],
    queryFn: () => partnersApi.getModifiers(partnerId),
    enabled: !!partnerId,
  });
  const modifiers = modifiersRaw || [];

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditing(null);
    setName("");
  };

  const saveMutation = useMutation({
    mutationFn: (value: string) =>
      editing ? partnersApi.renameModifier(editing.id, value) : partnersApi.createModifier(partnerId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_modifiers", partnerId] });
      toast.success(editing ? "Modifier renamed successfully" : "Modifier added successfully");
      closeDialog();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save modifier")),
  });

  const deleteMutation = useMutation({
    mutationFn: partnersApi.deleteModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_modifiers", partnerId] });
      toast.success("Modifier deleted successfully");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete modifier")),
  });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setIsDialogOpen(true);
  };

  const openRename = (modifier: PartnerModifier) => {
    setEditing(modifier);
    setName(modifier.name);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const value = name.trim();
    if (!value) {
      toast.error("Name is required");
      return;
    }
    saveMutation.mutate(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Modifier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifiers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[140px] text-right">Products</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4">Loading modifiers...</TableCell></TableRow>
              ) : modifiers.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No modifiers found</TableCell></TableRow>
              ) : (
                modifiers.map(modifier => (
                  <TableRow key={modifier.id}>
                    <TableCell className="font-medium">{modifier.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{modifier.products_count}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Rename ${modifier.name}`} onClick={() => openRename(modifier)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${modifier.name}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={modifier.products_count > 0}
                          onClick={async () => { if (await confirmDelete({ title: `Delete “${modifier.name}”?` })) deleteMutation.mutate(modifier.id); }}
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Rename Modifier" : "Add Modifier"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `The new name applies to all ${editing.products_count} products that use this modifier`
                : "Add a modifier name this partner's products can share"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="space-y-2 py-4">
              <Label htmlFor="modifier-name">Name</Label>
              <Input
                id="modifier-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Кокосовое молоко"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
