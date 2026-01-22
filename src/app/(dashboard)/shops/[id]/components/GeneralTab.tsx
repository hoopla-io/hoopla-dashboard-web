import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shopsApi } from "@/lib/api/domains/shops";
import { partnersApi } from "@/lib/api/domains/partners";
import type { CreateShopRequest } from "@/lib/api/schemas/shops";

interface GeneralTabProps {
  shopId: number;
}

export function GeneralTab({ shopId }: GeneralTabProps) {
  const queryClient = useQueryClient();
  
  const { data: shop } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => shopsApi.getById(shopId),
    enabled: !!shopId,
  });

  const { data: partnersData } = useQuery({
    queryKey: ["partners-list"],
    queryFn: () => partnersApi.getAll({ page: 1, limit: 100 }),
  });
  
  const partners = partnersData?.data || [];

  const [formData, setFormData] = useState<CreateShopRequest>({
    partner_id: 0,
    name: "",
    location_lat: 0,
    location_long: 0,
    vendor_terminal_id: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    if (shop) {
      setFormData({
        partner_id: shop.partner_id || shop.partner?.id || 0,
        name: shop.name,
        location_lat: shop.location_lat || 0,
        location_long: shop.location_long || 0,
        vendor_terminal_id: shop.vendor_terminal_id || "",
      });
    }
  }, [shop]);

  const updateMutation = useMutation({
    mutationFn: ({ data, file }: { data: Partial<CreateShopRequest>; file?: File }) =>
      shopsApi.update(shopId, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Shop updated successfully!");
      setSelectedFile(undefined);
    },
    onError: () => {
      toast.error("Failed to update shop");
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }
    if (!formData.partner_id) {
      toast.error("Partner is required");
      return;
    }
    updateMutation.mutate({ data: formData, file: selectedFile });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed");
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Details</CardTitle>
        <CardDescription>Update shop information and settings</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Shop name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partner">Partner</Label>
                <Select
                  value={String(formData.partner_id)}
                  onValueChange={(val) => setFormData({ ...formData, partner_id: Number(val) })}
                >
                  <SelectTrigger id="partner">
                    <SelectValue placeholder="Select Partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_terminal_id">Vendor Terminal ID</Label>
                <Input
                  id="vendor_terminal_id"
                  value={formData.vendor_terminal_id}
                  onChange={(e) => setFormData({ ...formData, vendor_terminal_id: e.target.value })}
                  placeholder="Terminal ID"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.location_lat}
                    onChange={(e) => setFormData({ ...formData, location_lat: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="long">Longitude</Label>
                  <Input
                    id="long"
                    type="number"
                    step="any"
                    value={formData.location_long}
                    onChange={(e) => setFormData({ ...formData, location_long: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Shop Image</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
