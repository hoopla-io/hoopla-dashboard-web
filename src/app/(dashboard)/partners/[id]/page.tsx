"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Plus, Pencil, Search, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";

import { partnersApi, shopsApi, drinksApi, ordersApi } from "@/lib/api";
import type { CreatePartnerRequest } from "@/lib/api";
import type { CreateShopRequest } from "@/lib/api/schemas/shops";
import type { CreatePartnerDrinkRequest } from "@/lib/api/schemas/drinks";
import type { CreatePartnerAttributeRequest } from "@/lib/api/schemas/partners";

function PartnerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const partnerId = Number(params.id);

  const [activeTab, setActiveTab] = useState("general");

  const { data: partner, isLoading: isLoadingPartner } = useQuery({
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
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        description: partner.description || "",
        vendor: (partner.vendor as any) || undefined,
        vendor_id: partner.vendor_id || "",
        vendor_key: partner.vendor_key || "",
        tin_type: (partner.tin_type as any) || undefined,
        tin_num: partner.tin_num || "",
        tin_percent: partner.tin_percent || 0,
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

  const [isCreateShopOpen, setIsCreateShopOpen] = useState(false);
  const [shopFormData, setShopFormData] = useState<CreateShopRequest>({
    partner_id: partnerId,
    name: "",
    location_lat: 0,
    location_long: 0,
    vendor_terminal_id: "",
  });
  const [shopFile, setShopFile] = useState<File | undefined>(undefined);

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
    // Ensure partner_id is set
    createShopMutation.mutate({ 
        data: { ...shopFormData, partner_id: partnerId }, 
        file: shopFile 
    });
  };

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
    pd.drink?.name.toLowerCase().includes(drinksFilter.toLowerCase())
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

  const [ordersFilter, setOrdersFilter] = useState("");
  
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["partner_orders", partnerId], 
    queryFn: () => ordersApi.getByPartner(partnerId),
    enabled: !!partnerId,
  });
  const orders = ordersData || [];
  
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


  if (isLoadingPartner) {
    return <div className="p-8 text-center text-muted-foreground">Loading partner details...</div>;
  }

  if (!partner) {
    return <div className="p-8 text-center text-destructive">Partner not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/partners")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
            {partner.logoUrl && (
                <img src={partner.logoUrl} alt={partner.name} className="h-12 w-12 rounded-full object-cover border" />
            )}
            <div>
                <h1 className="text-2xl font-bold">{partner.name}</h1>
                <p className="text-sm text-muted-foreground">Manage partner details and settings</p>
            </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shops">Shops</TabsTrigger>
          <TabsTrigger value="drinks">Drinks</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
        </TabsList>

        {/* --- GENERAL TAB --- */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Partner Details</CardTitle>
              <CardDescription>Update partner information and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual / Text */}
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
                    {selectedFile && <p className="text-xs text-muted-foreground">Selected: {selectedFile.name}</p>}
                  </div>
                </div>

                {/* Vendor Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Vendor Settings</h3>
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Select 
                        value={formData.vendor} 
                        onValueChange={(val: any) => setFormData({ ...formData, vendor: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Vendor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="iiko">Iiko</SelectItem>
                            <SelectItem value="poster">Poster</SelectItem>
                            <SelectItem value="deliveryhub">DeliveryHub</SelectItem>
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

                {/* Tax / Financial */}
                <div className="space-y-4">
                   <h3 className="text-lg font-medium">Tax & Financial</h3>
                   <div className="space-y-2">
                    <Label htmlFor="tin_type">TIN Type</Label>
                    <Select 
                        value={formData.tin_type} 
                        onValueChange={(val: any) => setFormData({ ...formData, tin_type: val })}
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
                </div>

              </div>

              <div className="flex justify-end pt-4">
                 <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                 </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shops" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCreateShopOpen(true)}>
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
                                <TableRow key={shop.id}>
                                    <TableCell>
                                        {shop.pictures?.[0]?.pictureUrl || shop.image_url ? (
                                            <img 
                                                src={shop.pictures?.[0]?.pictureUrl || shop.image_url} 
                                                alt={shop.name} 
                                                className="h-10 w-10 rounded-md object-cover" 
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
                                            onClick={() => deleteShopMutation.mutate(shop.id)}
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

            {/* Create Shop Dialog */}
            <Dialog open={isCreateShopOpen} onOpenChange={setIsCreateShopOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Shop</DialogTitle>
                        <DialogDescription>Create a new shop for this partner</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); handleCreateShop(); }}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="shop-name">Name</Label>
                                <Input 
                                    id="shop-name"
                                    value={shopFormData.name}
                                    onChange={(e) => setShopFormData({...shopFormData, name: e.target.value})}
                                    placeholder="Shop Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shop-terminal">Vendor Terminal ID</Label>
                                <Input 
                                    id="shop-terminal"
                                    value={shopFormData.vendor_terminal_id || ""}
                                    onChange={(e) => setShopFormData({...shopFormData, vendor_terminal_id: e.target.value})}
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
                                        onChange={(e) => setShopFormData({...shopFormData, location_lat: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shop-long">Longitude</Label>
                                    <Input 
                                        id="shop-long"
                                        type="number"
                                        step="any"
                                        value={shopFormData.location_long}
                                        onChange={(e) => setShopFormData({...shopFormData, location_long: parseFloat(e.target.value)})}
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
                            <Button type="submit" disabled={createShopMutation.isPending}>
                                {createShopMutation.isPending ? "Creating..." : "Create Shop"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </TabsContent>

        <TabsContent value="drinks" className="space-y-4">
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
                                         {pd.imageUrl ? (
                                            <img src={pd.imageUrl} alt={pd.vendor_product_name || "Drink"} className="h-10 w-10 rounded-md object-cover" />
                                        ) : pd.drink?.imageUrl ? (
                                             <img src={pd.drink.imageUrl} alt={pd.drink.name} className="h-10 w-10 rounded-md object-cover opacity-50" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs">No Img</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{pd.drink?.name || "-"}</TableCell>
                                    <TableCell>{pd.vendor_product_name || "-"}</TableCell>
                                    <TableCell>{pd.vendor_product_id || "-"}</TableCell>
                                    <TableCell>{pd.product_price?.toLocaleString() || "-"}</TableCell>
                                    <TableCell>{pd.vendor_product_price?.toLocaleString() || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => {
                                                    setDrinkEditId(pd.id);
                                                    setDrinkFormData({
                                                        partner_id: pd.partner_id,
                                                        drink_id: pd.drink_id,
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

           {/* Add/Edit Drink Dialog */}
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
                                        onValueChange={(val) => setDrinkFormData({...drinkFormData, drink_id: Number(val)})}
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
                                    onChange={(e) => setDrinkFormData({...drinkFormData, vendor_product_name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vendor_product_id">Vendor Product ID</Label>
                                <Input 
                                    id="vendor_product_id"
                                    value={drinkFormData.vendor_product_id || ""}
                                    onChange={(e) => setDrinkFormData({...drinkFormData, vendor_product_id: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="product_price">Price</Label>
                                    <Input 
                                        id="product_price"
                                        type="number"
                                        value={drinkFormData.product_price}
                                        onChange={(e) => setDrinkFormData({...drinkFormData, product_price: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendor_product_price">Vendor Price</Label>
                                    <Input 
                                        id="vendor_product_price"
                                        type="number"
                                        value={drinkFormData.vendor_product_price}
                                        onChange={(e) => setDrinkFormData({...drinkFormData, vendor_product_price: parseFloat(e.target.value)})}
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

        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
             <div className="flex justify-between items-center">
                <div className="max-w-sm w-full relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                        placeholder="Filter orders..." 
                        value={ordersFilter}
                        onChange={(e) => setOrdersFilter(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Shop</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingOrders ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-4">Loading orders...</TableCell></TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No orders found</TableCell></TableRow>
                            ) : (
                                orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">#{order.id}</TableCell>
                                        <TableCell>{order.user?.name || order.user?.phone_number || "-"}</TableCell>
                                        <TableCell>{order.shop?.name || "-"}</TableCell>
                                        <TableCell>{order.price?.toLocaleString()} сум</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                order.status === "completed" ? "default" : 
                                                order.status === "cancelled" ? "destructive" : 
                                                "secondary"
                                            }>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{order.time ? new Date(order.time).toLocaleDateString() : "-"}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="attributes" className="space-y-4">
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

            {/* Create Attribute Dialog */}
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
                                    onChange={(e) => setAttributeFormData({...attributeFormData, attribute_key: e.target.value})}
                                    placeholder="e.g., delivery_zone"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="attr-value">Value</Label>
                                <Input 
                                    id="attr-value"
                                    value={attributeFormData.attribute_value}
                                    onChange={(e) => setAttributeFormData({...attributeFormData, attribute_value: e.target.value})}
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
        </TabsContent>

      </Tabs>
    </div>
  );
}

export default function PartnerDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <PartnerDetailContent />
    </Suspense>
  );
}
