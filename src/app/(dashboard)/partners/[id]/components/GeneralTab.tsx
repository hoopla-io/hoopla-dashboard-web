import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { partnersApi } from "@/lib/api/domains/partners";
import type { CreatePartnerRequest } from "@/lib/api/schemas/partners";

interface GeneralTabProps {
  partnerId: number;
}

export function GeneralTab({ partnerId }: GeneralTabProps) {
  const queryClient = useQueryClient();
  const { data: partner } = useQuery({
    queryKey: ["partner", partnerId],
    queryFn: () => partnersApi.getById(partnerId),
    enabled: !!partnerId,
  });

  const [formData, setFormData] = useState<CreatePartnerRequest>({
    name: "",
    description: "",
    vendor: undefined,
    vendor_id: "",
    vendor_key: "",
    tin_type: undefined,
    tin_num: "",
    tin_percent: 0,
    cashback_percent: 0,
    status: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    if (partner) {
      // eslint-disable-next-line
      setFormData({
        name: partner.name,
        description: partner.description || "",
        // @ts-expect-error: vendor property may be null or undefined
        vendor: partner.vendor || undefined,
        vendor_id: partner.vendor_id || "",
        vendor_key: partner.vendor_key || "",
        // @ts-expect-error: tin_type property may be null or undefined
        tin_type: partner.tin_type || undefined,
        tin_num: partner.tin_num || "",
        tin_percent: partner.tin_percent || 0,
        cashback_percent: partner.cashback_percent || 0,
        status: partner.status ?? true,
      });
    }
  }, [partner]);

  const updateMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreatePartnerRequest; file?: File }) =>
      partnersApi.update(partnerId, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update partner");
    },
  });

  const handleUpdate = () => {
    if (!formData.name) {
      toast.error("Name is required");
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
        <CardTitle>Partner Details</CardTitle>
        <CardDescription>Update partner information and settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Visual & Text</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Logo</Label>
              <Input
                id="file"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
              />
              {partner?.image_url && !selectedFile && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Current Logo:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={partner.image_url} alt="Current Logo" className="h-16 w-16 object-cover rounded-md border" />
                </div>
              )}
              {selectedFile && <p className="text-xs text-muted-foreground">Selected: {selectedFile.name}</p>}
              <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Status</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.status ? "Active - Partner is active" : "Inactive - Partner is inactive"}
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Vendor Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select
                value={formData.vendor}
                // @ts-expect-error: Select onValueChange expects strict string type
                onValueChange={(val) => setFormData({ ...formData, vendor: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iiko">Iiko</SelectItem>
                  <SelectItem value="poster">Poster</SelectItem>
                  <SelectItem value="deliveryhub">DeliveryHub</SelectItem>
                  <SelectItem value="loyverse">Loyverse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_id">Vendor ID</Label>
              <Input
                id="vendor_id"
                value={formData.vendor_id || ""}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_key">Vendor Key</Label>
              <Input
                id="vendor_key"
                value={formData.vendor_key || ""}
                onChange={(e) => setFormData({ ...formData, vendor_key: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tax & Financial</h3>
            <div className="space-y-2">
              <Label htmlFor="tin_type">TIN Type</Label>
              <Select
                value={formData.tin_type}
                // @ts-expect-error: Select onValueChange expects strict string type
                onValueChange={(val) => setFormData({ ...formData, tin_type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tin">TIN</SelectItem>
                  <SelectItem value="pinfl">PINFL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tin_num">TIN Number</Label>
              <Input
                id="tin_num"
                value={formData.tin_num || ""}
                onChange={(e) => setFormData({ ...formData, tin_num: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tin_percent">TIN Percent</Label>
              <Input
                id="tin_percent"
                type="number"
                step="0.01"
                value={formData.tin_percent || 0}
                onChange={(e) => setFormData({ ...formData, tin_percent: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashback_percent">Cashback Percent</Label>
              <Input
                id="cashback_percent"
                type="number"
                step="0.01"
                value={formData.cashback_percent || 0}
                onChange={(e) => setFormData({ ...formData, cashback_percent: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
