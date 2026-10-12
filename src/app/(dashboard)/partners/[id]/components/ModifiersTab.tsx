import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, ImageIcon } from "lucide-react";
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

const MAX_IMAGE_SIZE = 1024 * 1024;

interface ModifiersTabProps {
  partnerId: number;
}

export function ModifiersTab({ partnerId }: ModifiersTabProps) {
  const queryClient = useQueryClient();
  const confirmDelete = useConfirm();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerModifier | null>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);
  const imagePreview = filePreview ?? (removeImage ? null : editing?.image_url ?? null);

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
    setFile(null);
    setRemoveImage(false);
    setFileInputKey(key => key + 1);
  };

  const saveMutation = useMutation({
    mutationFn: (value: string) =>
      editing
        ? partnersApi.updateModifier(editing.id, value, file ?? undefined, removeImage)
        : partnersApi.createModifier(partnerId, value, file ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_modifiers", partnerId] });
      toast.success(editing ? "Modifier updated successfully" : "Modifier added successfully");
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
    closeDialog();
    setIsDialogOpen(true);
  };

  const openEdit = (modifier: PartnerModifier) => {
    closeDialog();
    setEditing(modifier);
    setName(modifier.name);
    setIsDialogOpen(true);
  };

  const handleFileChange = (selected: File | undefined) => {
    if (!selected) return;
    const isPng = selected.type === "image/png" || selected.name.toLowerCase().endsWith(".png");
    const isSvg = selected.type === "image/svg+xml" || selected.name.toLowerCase().endsWith(".svg");
    if (!isPng && !isSvg) {
      toast.error("Image must be a PNG or SVG");
      setFileInputKey(key => key + 1);
      return;
    }
    if (selected.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be up to 1 MB");
      setFileInputKey(key => key + 1);
      return;
    }
    setFile(selected);
    setRemoveImage(false);
  };

  const clearImage = () => {
    if (file) setFile(null);
    else setRemoveImage(true);
    setFileInputKey(key => key + 1);
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
                <TableHead className="w-[64px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[140px] text-right">Products</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4">Loading modifiers...</TableCell></TableRow>
              ) : modifiers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No modifiers found</TableCell></TableRow>
              ) : (
                modifiers.map(modifier => (
                  <TableRow key={modifier.id}>
                    <TableCell>
                      {modifier.image_url ? (
                        <img src={modifier.image_url} alt={modifier.name} className="h-10 w-10 rounded border object-contain" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded border text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{modifier.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{modifier.products_count}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${modifier.name}`} onClick={() => openEdit(modifier)}>
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
            <DialogTitle>{editing ? "Edit Modifier" : "Add Modifier"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `The name and image apply to all ${editing.products_count} products that use this modifier`
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
            <div className="space-y-2 pb-4">
              <Label htmlFor="modifier-image">Image</Label>
              {imagePreview && (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg border object-contain" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <Input
                id="modifier-image"
                key={fileInputKey}
                type="file"
                accept=".png,.svg,image/png,image/svg+xml"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
              <p className="text-xs text-muted-foreground">PNG or SVG, up to 1 MB{editing?.image_url ? ". Leave empty to keep the current image" : ""}</p>
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
