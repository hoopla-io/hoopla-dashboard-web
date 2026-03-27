import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { drinksApi } from "@/lib/api/domains/drinks";
import type { CreatePartnerDrinkRequest, PartnerDrink } from "@/lib/api/schemas/drinks";

interface DrinksTabProps {
  partnerId: number;
}

export function DrinksTab({ partnerId }: DrinksTabProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDrinkDialogOpen, setIsDrinkDialogOpen] = useState(false);
  const [drinkEditId, setDrinkEditId] = useState<number | null>(null);
  const [drinksFilter, setDrinksFilter] = useState("");
  const [drinkFormData, setDrinkFormData] = useState<CreatePartnerDrinkRequest>({
    partner_id: partnerId,
    drink_id: 0,
    vendor_product_id: "",
    product_price: 0,
    vendor_product_price: 0,
    vendor_product_name: "",
  });
  const [drinkFile, setDrinkFile] = useState<File | undefined>(undefined);

  const { data: partnerDrinks, isLoading: isLoadingPartnerDrinks } = useQuery({
    queryKey: ["partner_drinks", partnerId],
    queryFn: () => drinksApi.getByPartner(partnerId),
    enabled: !!partnerId,
  });

  const { data: allDrinksData } = useQuery({
    queryKey: ["drinks"],
    queryFn: () => drinksApi.getAll(),
  });
  const allDrinks = allDrinksData?.data || [];

  const filteredDrinks = (partnerDrinks || []).filter(pd =>
    pd.vendor_product_name?.toLowerCase().includes(drinksFilter.toLowerCase()) ||
    pd.name?.toLowerCase().includes(drinksFilter.toLowerCase())
  );

  const createDrinkMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreatePartnerDrinkRequest; file?: File }) =>
      drinksApi.assignToPartner(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drinks", partnerId] });
      toast.success("Drink assigned successfully");
      setIsDrinkDialogOpen(false);
    },
    onError: () => toast.error("Failed to assign drink"),
  });

  const updateDrinkMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: CreatePartnerDrinkRequest; file?: File }) =>
      drinksApi.updatePartnerDrink(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drinks", partnerId] });
      toast.success("Drink updated successfully");
      setIsDrinkDialogOpen(false);
    },
    onError: () => toast.error("Failed to update drink"),
  });

  const deleteDrinkMutation = useMutation({
    mutationFn: drinksApi.deletePartnerDrink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_drinks", partnerId] });
      toast.success("Drink removed successfully");
    },
    onError: () => toast.error("Failed to remove drink"),
  });

  const handleSaveDrink = () => {
    if (drinkEditId) {
      updateDrinkMutation.mutate({ id: drinkEditId, data: drinkFormData, file: drinkFile });
    } else {
      if (!drinkFormData.drink_id) {
        toast.error("Please select a drink");
        return;
      }
      createDrinkMutation.mutate({ data: { ...drinkFormData, partner_id: partnerId }, file: drinkFile });
    }
  };

  const handleNavigateToModifiers = (pd: PartnerDrink) => {
    const drinkName = encodeURIComponent(pd.vendor_product_name || pd.name || pd.drink?.name || "Drink");
    router.push(`/partners/${partnerId}/drinks/${pd.id}/modifiers?drinkName=${drinkName}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="max-w-sm w-full relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter drinks..."
            value={drinksFilter}
            onChange={(e) => setDrinksFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => {
          setDrinkEditId(null);
          setDrinkFormData({ partner_id: partnerId, drink_id: 0, product_price: 0, vendor_product_price: 0, vendor_product_name: "", vendor_product_id: "" });
          setDrinkFile(undefined);
          setIsDrinkDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Drink
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drinks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Vendor ID</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Vendor Price</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPartnerDrinks ? (
                <TableRow><TableCell colSpan={7} className="text-center py-4">Loading drinks...</TableCell></TableRow>
              ) : filteredDrinks.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No drinks found</TableCell></TableRow>
              ) : (
                filteredDrinks.map(pd => (
                  <TableRow key={pd.id}>
                    <TableCell>
                      {pd.image_url || pd.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pd.image_url || pd.imageUrl || ""} alt={pd.vendor_product_name || "Drink"} className="h-10 w-10 rounded-md object-cover" />
                      ) : pd.drink?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pd.drink.image_url} alt={pd.drink.name} className="h-10 w-10 rounded-md object-cover opacity-50" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs">No Img</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{pd.name || pd.drink?.name || "-"}</TableCell>
                    <TableCell>{pd.vendor_product_name || "-"}</TableCell>
                    <TableCell>{pd.vendor_product_id || "-"}</TableCell>
                    <TableCell>{pd.product_price?.toLocaleString() || "-"}</TableCell>
                    <TableCell>{pd.vendor_product_price?.toLocaleString() || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigateToModifiers(pd)}
                        >
                          Add addons
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDrinkEditId(pd.id);
                            setDrinkFormData({
                              partner_id: pd.partner_id,
                              drink_id: pd.drink_id || 0,
                              vendor_product_id: pd.vendor_product_id || "",
                              product_price: pd.product_price || 0,
                              vendor_product_price: pd.vendor_product_price || 0,
                              vendor_product_name: pd.vendor_product_name || "",
                            });
                            setDrinkFile(undefined);
                            setIsDrinkDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteDrinkMutation.mutate(pd.id)}
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

      <Dialog open={isDrinkDialogOpen} onOpenChange={setIsDrinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{drinkEditId ? "Edit Drink" : "Add Drink"}</DialogTitle>
            <DialogDescription>{drinkEditId ? "Update drink details" : "Assign a new drink to this partner"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveDrink(); }}>
            <div className="space-y-4 py-4">
              {!drinkEditId && (
                <div className="space-y-2">
                  <Label htmlFor="drink-select">Select Drink</Label>
                  <Select
                    value={String(drinkFormData.drink_id)}
                    onValueChange={(val) => setDrinkFormData({ ...drinkFormData, drink_id: Number(val) })}
                    disabled={!!drinkEditId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a drink" />
                    </SelectTrigger>
                    <SelectContent>
                      {allDrinks.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="vendor_product_name">Vendor Product Name</Label>
                <Input
                  id="vendor_product_name"
                  value={drinkFormData.vendor_product_name || ""}
                  onChange={(e) => setDrinkFormData({ ...drinkFormData, vendor_product_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor_product_id">Vendor Product ID</Label>
                <Input
                  id="vendor_product_id"
                  value={drinkFormData.vendor_product_id || ""}
                  onChange={(e) => setDrinkFormData({ ...drinkFormData, vendor_product_id: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_price">Price</Label>
                  <Input
                    id="product_price"
                    type="number"
                    value={drinkFormData.product_price}
                    onChange={(e) => setDrinkFormData({ ...drinkFormData, product_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor_product_price">Vendor Price</Label>
                  <Input
                    id="vendor_product_price"
                    type="number"
                    value={drinkFormData.vendor_product_price}
                    onChange={(e) => setDrinkFormData({ ...drinkFormData, vendor_product_price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="drink-file">Image</Label>
                <Input
                  id="drink-file"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setDrinkFile(e.target.files[0]);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDrinkDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDrinkMutation.isPending || updateDrinkMutation.isPending}>
                {createDrinkMutation.isPending || updateDrinkMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
