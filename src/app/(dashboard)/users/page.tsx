"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Trash2, MoreHorizontal, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

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
import { usersApi } from "@/lib/api";
import type { User, EditUserRequest } from "@/lib/api";

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<EditUserRequest>({});
  const [currentPage, setCurrentPage] = useState(1);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });

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

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone_number?.includes(search) ||
    String(user.id).includes(search)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatCurrency = (value?: number) => {
    return typeof value === "number" ? new Intl.NumberFormat("uz-UZ").format(value) : "0";
  };

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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Mobile Provider</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
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
                    <span className={user.balance && user.balance < 0 ? "text-red-500" : "text-emerald-500"}>
                      {formatCurrency(user.balance)} UZS
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(user.updated_at)}
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
                          setEditUser(user);
                          setFormData({
                            name: user.name,
                            phone_number: user.phone_number,
                            gender: user.gender,
                            mobile_provider: user.mobile_provider,
                          });
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(user.id)}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
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
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editUser && updateMutation.mutate({ id: editUser.id, data: formData }); }}>
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
