import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { ShopForm } from "@/components/forms/shop-form";
import { shopsApi } from "@/lib/api/domains/shops";
import type { CreateShopRequest } from "@/lib/api/schemas/shops";

interface ShopsTabProps {
  partnerId: number;
}

export function ShopsTab({ partnerId }: ShopsTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false);

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
    },
    onError: () => toast.error("Failed to create shop"),
  });

  const deleteShopMutation = useMutation({
    mutationFn: shopsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops", partnerId] });
      toast.success("Shop deleted successfully");
    },
    onError: () => toast.error("Failed to delete shop"),
  });

  const handleAddClick = () => {
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
          <DataTableShell>
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
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : shops.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState title="No shops found" description="Add the first shop for this partner." />
                  </TableCell>
                </TableRow>
              ) : (
                shops.map(shop => (
                  <TableRow 
                    key={shop.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/shops/${shop.id}`)}
                  >
                    <TableCell>#{shop.id}</TableCell>
                    <TableCell>
                      {shop.image_url ? (
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
          </DataTableShell>
        </CardContent>
      </Card>

      <Dialog open={isCreateShopOpen} onOpenChange={setIsCreateShopOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Shop</DialogTitle>
            <DialogDescription>Create a new shop for this partner</DialogDescription>
          </DialogHeader>
          <ShopForm
            partnerId={partnerId}
            isEditing={false}
            isSubmitting={createShopMutation.isPending}
            onSubmit={(data, file) => createShopMutation.mutate({ data, file })}
            onCancel={() => setIsCreateShopOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
