"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shopsApi, partnersApi } from "@/lib/api";
import type { Shop, CreateShopRequest } from "@/lib/api";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ShopsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  // Check for action param on mount
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/shops?${params.toString()}`);
    }
  }, [searchParams, router]);
  const [editShop, setEditShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState<CreateShopRequest>({
    partner_id: 0,
    name: "",
    location_lat: 0,
    location_long: 0,
  });

  const { data: shopsData = { data: [] }, isLoading } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsApi.getAll,
  });

  const { data: partnersData = { data: [] } } = useQuery({
    queryKey: ["partners"],
    queryFn: partnersApi.getAll,
  });
  
  const partners = partnersData.data || [];

  const createMutation = useMutation({
    mutationFn: (data: CreateShopRequest) => shopsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Shop created successfully!");
      setIsCreateOpen(false);
      setFormData({ partner_id: 0, name: "", location_lat: 0, location_long: 0 });
    },
    onError: () => toast.error("Failed to create shop"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateShopRequest> }) =>
      shopsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Shop updated successfully!");
      setEditShop(null);
    },
    onError: () => toast.error("Failed to update shop"),
  });

  const deleteMutation = useMutation({
    mutationFn: shopsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shops"] });
      toast.success("Shop deleted successfully!");
    },
    onError: () => toast.error("Failed to delete shop"),
  });

  const filteredShops = (shopsData.data || []).filter((shop) =>
    shop.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPartnerName = (partnerId: number) => {
    return partners.find((p) => p.id === partnerId)?.name || "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shops</h1>
          <p className="text-muted-foreground">Manage shop locations</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Shop
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search shops..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No shops found
                </TableCell>
              </TableRow>
            ) : (
              filteredShops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell>
                    {shop.image_url ? (
                      <div 
                        className="cursor-pointer overflow-hidden rounded-md border border-border"
                        onClick={() => setSelectedImage(shop.image_url)}
                      >
                         <img
                          src={shop.image_url}
                          alt={shop.name}
                          className="h-10 w-10 object-cover hover:scale-110 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">No Img</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>{shop.partner?.name || "-"}</TableCell>
                  <TableCell>
                    {shop.location_lat && shop.location_long ? (
                      <a
                        href={`https://yandex.com/maps/?text=${shop.location_lat},${shop.location_long}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <MapPin className="h-3 w-3" />
                        {shop.location_lat.toFixed(4)}, {shop.location_long.toFixed(4)}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                     <Badge variant={!shop.deleted_at ? "default" : "destructive"}>
                      {!shop.deleted_at ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditShop(shop);
                          setFormData({
                            partner_id: shop.partner?.id || shop.partner_id || 0,
                            name: shop.name,
                            location_lat: shop.location_lat || 0,
                            location_long: shop.location_long || 0,
                          });
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(shop.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shop</DialogTitle>
            <DialogDescription>Add a new shop location</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Partner</Label>
                <Select
                  value={String(formData.partner_id)}
                  onValueChange={(v) => setFormData({ ...formData, partner_id: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Shop name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input 
                    type="number" 
                    value={formData.location_lat === 0 ? "" : formData.location_lat} 
                    onChange={(e) => setFormData({ ...formData, location_lat: Number(e.target.value) })} 
                    placeholder="Latitude"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input 
                    type="number" 
                    value={formData.location_long === 0 ? "" : formData.location_long} 
                    onChange={(e) => setFormData({ ...formData, location_long: Number(e.target.value) })} 
                    placeholder="Longitude"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editShop} onOpenChange={() => setEditShop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
            <DialogDescription>Update shop information</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editShop && updateMutation.mutate({ id: editShop.id, data: formData }); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Partner</Label>
                <Select
                  value={String(formData.partner_id)}
                  onValueChange={(v) => setFormData({ ...formData, partner_id: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Shop name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input 
                    type="number" 
                    value={formData.location_lat === 0 ? "" : formData.location_lat} 
                    onChange={(e) => setFormData({ ...formData, location_lat: Number(e.target.value) })} 
                    placeholder="Latitude"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input 
                    type="number" 
                    value={formData.location_long === 0 ? "" : formData.location_long} 
                    onChange={(e) => setFormData({ ...formData, location_long: Number(e.target.value) })} 
                    placeholder="Longitude"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditShop(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(undefined)}>
        <DialogContent className="max-w-3xl border-none bg-transparent shadow-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImage && (
            <div className="relative h-[80vh] w-full flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Shop Preview"
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
