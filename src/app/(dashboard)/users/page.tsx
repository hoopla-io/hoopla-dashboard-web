"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usersApi } from "@/lib/api/domains/users";
import type { User, EditUserRequest } from "@/lib/api/schemas/users";

import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

const ITEMS_PER_PAGE = 10;

import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

function UsersContent() {
  const queryClient = useQueryClient();
  
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [nameFilter, setNameFilter] = useQueryState("name", parseAsString.withOptions({ throttleMs: 500 }).withDefault(""));
  const [phoneFilter, setPhoneFilter] = useQueryState("phone", parseAsString.withOptions({ throttleMs: 500 }).withDefault(""));
  const [genderFilter, setGenderFilter] = useQueryState("gender", parseAsString.withDefault("all"));

  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<EditUserRequest>({});

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", currentPage, nameFilter, phoneFilter, genderFilter],
    queryFn: () => usersApi.getAll({ 
      page: currentPage, 
      limit: ITEMS_PER_PAGE,
      name: nameFilter || undefined,
      phone_number: phoneFilter || undefined,
      gender: genderFilter !== "all" ? genderFilter : undefined,
    }),
  });

  const users = usersData?.data || [];
  const meta = usersData?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || 0;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditUserRequest }) => 
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully!");
      setEditUser(null);
    },
    onError: () => toast.error("Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully!");
    },
    onError: () => toast.error("Failed to delete user"),
  });



  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage registered users</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Filter by Name..."
            value={nameFilter}
            onChange={(e) => { setNameFilter(e.target.value || null); setCurrentPage(1); }}
          />
          <Input
            placeholder="Filter by Phone..."
            value={phoneFilter}
            onChange={(e) => { setPhoneFilter(e.target.value || null); setCurrentPage(1); }}
          />
          <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => {
              setNameFilter(null);
              setPhoneFilter(null);
              setGenderFilter(null);
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Mobile Provider</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "-"}</TableCell>
                  <TableCell>{user.phone_number || "-"}</TableCell>
                  <TableCell>
                    {user.mobile_provider ? (
                        <Badge variant="outline">{user.mobile_provider}</Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {user.gender ? (
                      <Badge variant="secondary">{user.gender}</Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {formatDate(user.date_of_birth)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Button 
                        variant="ghost" 
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => {
                          setEditUser(user);
                          setFormData({
                            name: user.name,
                            phone_number: user.phone_number,
                            gender: user.gender,
                            mobile_provider: user.mobile_provider,
                          });
                        }}
                      >
                         <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive cursor-pointer"
                        onClick={() => deleteMutation.mutate(user.id)}
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
      </div>

       <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} users
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editUser) updateMutation.mutate({ id: editUser.id, data: formData }); }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="User name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone_number || ""} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Input value={formData.gender || ""} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} placeholder="Gender" />
              </div>
              <div className="space-y-2">
                 <Label>Mobile Provider</Label>
                 <Input value={formData.mobile_provider || ""} onChange={(e) => setFormData({ ...formData, mobile_provider: e.target.value })} placeholder="Mobile Provider" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ErrorBoundary pageName="Users">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading users...</div>}>
        <UsersContent />
      </Suspense>
    </ErrorBoundary>
  );
}

