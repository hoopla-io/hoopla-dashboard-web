import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { shopsApi } from "@/lib/api/domains/shops";
import type { CreateShopRequest } from "@/lib/api/schemas/shops";

interface ShopsTabProps {
  partnerId: number;
}

export function ShopsTab({ partnerId }: ShopsTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false);
  const [shopFormData, setShopFormData] = useState<CreateShopRequest>({
    partner_id: partnerId,
    name: "",
    location_lat: 0,
    location_long: 0,
    vendor_terminal_id: "",
  });
  const [shopFile, setShopFile] = useState<File | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingShop, setEditingShop] = useState<any | null>(null);

  const { data: shopsData, isLoading: isLoadingShops } = useQuery({
    queryKey: ["shops", partnerId],
    queryFn: () => shopsApi.getByPartner(partnerId),
    enabled: !!partnerId,
  });
  const shops = shopsData || [];

  const createShopMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateShopRequest; file?: File }) =>
      shopsApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops", partnerId] });
      toast.success("Shop created successfully");
      setIsCreateShopOpen(false);
      setShopFormData({
        partner_id: partnerId,
        name: "",
        location_lat: 0,
        location_long: 0,
        vendor_terminal_id: "",
      });
      setShopFile(undefined);
    },
    onError: () => toast.error("Failed to create shop"),
  });

  const updateShopMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateShopRequest>; file?: File }) =>
      shopsApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops", partnerId] });
      toast.success("Shop updated successfully");
      setIsCreateShopOpen(false);
      setShopFormData({
        partner_id: partnerId,
        name: "",
        location_lat: 0,
        location_long: 0,
        vendor_terminal_id: "",
      });
      setShopFile(undefined);
      setEditingShop(null);
    },
    onError: () => toast.error("Failed to update shop"),
  });

  const deleteShopMutation = useMutation({
    mutationFn: shopsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops", partnerId] });
      toast.success("Shop deleted successfully");
    },
    onError: () => toast.error("Failed to delete shop"),
  });

  const handleCreateShop = () => {
    if (!shopFormData.name) {
      toast.error("Shop name is required");
      return;
    }
    if (editingShop) {
      updateShopMutation.mutate({
        id: editingShop.id,
        data: { ...shopFormData, partner_id: partnerId },
        file: shopFile
      });
    } else {
      createShopMutation.mutate({
        data: { ...shopFormData, partner_id: partnerId },
        file: shopFile
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditClick = (shop: any) => {
    setEditingShop(shop);
    setShopFormData({
      partner_id: partnerId,
      name: shop.name,
      location_lat: shop.location?.lat ?? shop.location_lat ?? 0,
      location_long: shop.location?.lng ?? shop.location_long ?? 0,
      vendor_terminal_id: shop.vendor_terminal_id || "",
    });
    setShopFile(undefined);
    setIsCreateShopOpen(true);
  };

  const handleAddClick = () => {
    setEditingShop(null);
    setShopFormData({
      partner_id: partnerId,
      name: "",
      location_lat: 0,
      location_long: 0,
      vendor_terminal_id: "",
    });
    setShopFile(undefined);
    setIsCreateShopOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Shop
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shops</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Terminal ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingShops ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4">Loading shops...</TableCell></TableRow>
              ) : shops.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No shops found</TableCell></TableRow>
              ) : (
                shops.map(shop => (
                  <TableRow 
                    key={shop.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/shops/${shop.id}`)}
                  >
                    <TableCell>#{shop.id}</TableCell>
                    <TableCell>
                      {shop.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={shop.image_url}
                          alt={shop.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs">No Img</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>{shop.vendor_terminal_id || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(shop.location?.lat ?? shop.location_lat)?.toFixed(4)}, {(shop.location?.lng ?? shop.location_long)?.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(shop);
                        }}
                      >
                         <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteShopMutation.mutate(shop.id);
                        }}
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

      <Dialog open={isCreateShopOpen} onOpenChange={setIsCreateShopOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShop ? "Edit Shop" : "Add New Shop"}</DialogTitle>
            <DialogDescription>{editingShop ? "Update shop details" : "Create a new shop for this partner"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateShop(); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Name</Label>
                <Input
                  id="shop-name"
                  value={shopFormData.name}
                  onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })}
                  placeholder="Shop Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-terminal">Vendor Terminal ID</Label>
                <Input
                  id="shop-terminal"
                  value={shopFormData.vendor_terminal_id || ""}
                  onChange={(e) => setShopFormData({ ...shopFormData, vendor_terminal_id: e.target.value })}
                  placeholder="Terminal ID"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-lat">Latitude</Label>
                  <Input
                    id="shop-lat"
                    type="number"
                    step="any"
                    value={shopFormData.location_lat}
                    onChange={(e) => setShopFormData({ ...shopFormData, location_lat: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-long">Longitude</Label>
                  <Input
                    id="shop-long"
                    type="number"
                    step="any"
                    value={shopFormData.location_long}
                    onChange={(e) => setShopFormData({ ...shopFormData, location_long: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-file">Image</Label>
                <Input
                  id="shop-file"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setShopFile(e.target.files[0]);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateShopOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createShopMutation.isPending || updateShopMutation.isPending}>
                {createShopMutation.isPending || updateShopMutation.isPending ? "Saving..." : (editingShop ? "Update Shop" : "Create Shop")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
