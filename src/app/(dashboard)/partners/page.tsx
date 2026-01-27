"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, ChevronLeft, ChevronRight, Upload } from "lucide-react";

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
import { partnersApi } from "@/lib/api/domains/partners";
import type { Partner, CreatePartnerRequest } from "@/lib/api/schemas/partners";

import { useSearchParams, useRouter } from "next/navigation";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { ErrorBoundary } from "@/components/error-boundary";

const ITEMS_PER_PAGE = 10;

function PartnersContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", parseAsString.withOptions({ throttleMs: 500 }).withDefault(""));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setIsCreateOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/partners?${params.toString()}`);
    }
  }, [searchParams, router]);
  
  const [formData, setFormData] = useState<CreatePartnerRequest>({ name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const { data: partnersData, isLoading } = useQuery({
    queryKey: ["partners", currentPage, search],
    queryFn: () => partnersApi.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: search || undefined
    }),
  });

  const partners = partnersData?.data || [];
  const meta = partnersData?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || 0;

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreatePartnerRequest; file?: File }) =>
      partnersApi.create(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner created successfully!");
      setIsCreateOpen(false);
      setFormData({ name: "", description: "" });
      setSelectedFile(undefined);
    },
    onError: () => {
      toast.error("Failed to create partner");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreatePartnerRequest>; file?: File }) =>
      partnersApi.update(id, data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner updated successfully!");
      setSelectedFile(undefined);
    },
    onError: () => {
      toast.error("Failed to update partner");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: partnersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete partner");
    },
  });


  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }
    createMutation.mutate({ data: formData, file: selectedFile });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partners</h1>
          <p className="text-muted-foreground">Manage your partner organizations</p>
        </div>
        <Button onClick={() => {
          setFormData({ name: "", description: "" });
          setSelectedFile(undefined);
          setIsCreateOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Partner
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value || null);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[80px]">Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>TIN Info</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No partners found
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => (
                <TableRow 
                  key={partner.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/partners/${partner.id}`)}
                >
                  <TableCell className="font-medium">#{partner.id}</TableCell>
                  <TableCell>
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium">No Logo</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.vendor || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="text-muted-foreground">{partner.tin_type || "-"}</span>
                      <span>{partner.tin_num || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {partner.created_at
                      ? new Date(partner.created_at).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.status === "Inactive" ? "destructive" : "default"}>
                      {partner.status || "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(partner.id)}
                        >
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
           Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} partners
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
            <DialogTitle>Create Partner</DialogTitle>
            <DialogDescription>Add a new partner organization</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter partner name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Logo (JPG/PNG)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <ErrorBoundary pageName="Partners">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading partners...</div>}>
         <PartnersContent />
      </Suspense>
    </ErrorBoundary>
  );
}
