"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

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
import { shopsApi } from "@/lib/api/domains/shops";
import { partnersApi } from "@/lib/api/domains/partners";
import type { Shop, CreateShopRequest } from "@/lib/api/schemas/shops";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { ErrorBoundary } from "@/components/error-boundary";

const ITEMS_PER_PAGE = 10;

function ShopsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [searchTerm, setSearchTerm] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm || null);
      if (searchTerm !== search) {
         setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, setSearch, setCurrentPage, search]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/shops?${params.toString()}`);
    }
  }, [searchParams, router]);
  const [formData, setFormData] = useState<CreateShopRequest>({
    partner_id: 0,
    name: "",
    location_lat: 0,
    location_long: 0,
  });

  const { data: shopsData, isLoading } = useQuery({
    queryKey: ["shops", currentPage, search],
    queryFn: () => shopsApi.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: search || undefined
    }),
  });

  const shops = shopsData?.data || [];
  const meta = shopsData?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || 0;

  const { data: partnersData } = useQuery({
    queryKey: ["partners-list"],
    queryFn: () => partnersApi.getAll({
        page: 1,
        limit: 100
    }),
  });
  
  const partners = partnersData?.data || [];

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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
            ) : shops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No shops found
                </TableCell>
              </TableRow>
            ) : (
              shops.map((shop) => (
                <TableRow 
                  key={shop.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/shops/${shop.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {shop.image_url ? (
                      <button
                        type="button"
                        className="cursor-pointer overflow-hidden rounded-md border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={() => setSelectedImage(shop.image_url)}
                      >
                         <img
                          src={shop.image_url}
                          alt={shop.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover hover:scale-110 transition-transform"
                        />
                      </button>
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin className="h-3 w-3" />
                        {shop.location_lat.toFixed(4)}, {shop.location_long.toFixed(4)}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                     <Badge variant={shop.status === "Inactive" ? "destructive" : "default"}>
                      {shop.status || "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Open shop actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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

       <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
           Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} shops
        </div>
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, (p || 1) - 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
            <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, (p || 1) + 1))}
                disabled={currentPage === totalPages}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>

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

export default function ShopsPage() {
  return (
    <ErrorBoundary pageName="Shops">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading shops...</div>}>
         <ShopsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
