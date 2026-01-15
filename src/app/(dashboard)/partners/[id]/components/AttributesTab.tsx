import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { partnersApi } from "@/lib/api/domains/partners";
import type { CreatePartnerAttributeRequest } from "@/lib/api/schemas/partners";

interface AttributesTabProps {
  partnerId: number;
}

export function AttributesTab({ partnerId }: AttributesTabProps) {
  const queryClient = useQueryClient();
  const [isCreateAttributeOpen, setIsCreateAttributeOpen] = useState(false);
  const [attributeFormData, setAttributeFormData] = useState<CreatePartnerAttributeRequest>({
    partner_id: partnerId,
    attribute_key: "",
    attribute_value: "",
  });

  const { data: attributesRaw, isLoading: isLoadingAttributes } = useQuery({
    queryKey: ["partner_attributes", partnerId],
    queryFn: () => partnersApi.getAttributes(partnerId),
    enabled: !!partnerId,
  });
  const attributes = attributesRaw || [];

  const createAttributeMutation = useMutation({
    mutationFn: (data: CreatePartnerAttributeRequest) => partnersApi.createAttribute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_attributes", partnerId] });
      toast.success("Attribute added successfully");
      setIsCreateAttributeOpen(false);
      setAttributeFormData({ partner_id: partnerId, attribute_key: "", attribute_value: "" });
    },
    onError: () => toast.error("Failed to add attribute"),
  });

  const deleteAttributeMutation = useMutation({
    mutationFn: partnersApi.deleteAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_attributes", partnerId] });
      toast.success("Attribute deleted successfully");
    },
    onError: () => toast.error("Failed to delete attribute"),
  });

  const handleCreateAttribute = () => {
    if (!attributeFormData.attribute_key || !attributeFormData.attribute_value) {
      toast.error("Key and Value are required");
      return;
    }
    createAttributeMutation.mutate({ ...attributeFormData, partner_id: partnerId });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateAttributeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Attribute
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAttributes ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4">Loading attributes...</TableCell></TableRow>
              ) : attributes.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No attributes found</TableCell></TableRow>
              ) : (
                attributes.map(attr => (
                  <TableRow key={attr.id}>
                    <TableCell className="font-medium">{attr.attribute_key}</TableCell>
                    <TableCell>{attr.attribute_value}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteAttributeMutation.mutate(attr.id)}
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

      <Dialog open={isCreateAttributeOpen} onOpenChange={setIsCreateAttributeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Attribute</DialogTitle>
            <DialogDescription>Add a new key-value attribute for this partner</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateAttribute(); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="attr-key">Key</Label>
                <Input
                  id="attr-key"
                  value={attributeFormData.attribute_key}
                  onChange={(e) => setAttributeFormData({ ...attributeFormData, attribute_key: e.target.value })}
                  placeholder="e.g., delivery_zone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attr-value">Value</Label>
                <Input
                  id="attr-value"
                  value={attributeFormData.attribute_value}
                  onChange={(e) => setAttributeFormData({ ...attributeFormData, attribute_value: e.target.value })}
                  placeholder="e.g., zone_1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateAttributeOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createAttributeMutation.isPending}>
                {createAttributeMutation.isPending ? "Adding..." : "Add Attribute"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
