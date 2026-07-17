import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { partnersApi } from "@/lib/api/domains/partners";
import type { CreatePartnerHoursRequest } from "@/lib/api/schemas/partners";

interface HoursTabProps {
  partnerId: number;
}

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function HoursTab({ partnerId }: HoursTabProps) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<CreatePartnerHoursRequest, "partner_id">>({
    week_day: "",
    open_at: "",
    close_at: "",
  });

  const { data: hours, isLoading } = useQuery({
    queryKey: ["partner-hours", partnerId],
    queryFn: () => partnersApi.getHours(partnerId),
    enabled: !!partnerId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePartnerHoursRequest) => partnersApi.createHours(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-hours", partnerId] });
      toast.success("Hours added successfully!");
      setIsAddOpen(false);
      setFormData({ week_day: "", open_at: "", close_at: "" });
    },
    onError: () => toast.error("Failed to add hours"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => partnersApi.deleteHours(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-hours", partnerId] });
      toast.success("Hours deleted successfully!");
    },
    onError: () => toast.error("Failed to delete hours"),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.week_day || !formData.open_at || !formData.close_at) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate({ ...formData, partner_id: partnerId });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Default Working Hours</CardTitle>
            <CardDescription>
              Fallback weekly schedule shops inherit unless they set their own hours or always-open.
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Hours
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Add Default Working Hours</DialogTitle>
                  <DialogDescription>
                    Set opening and closing times for a specific day.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Day of the Week</Label>
                    <Select
                      value={formData.week_day}
                      onValueChange={(val) => setFormData({ ...formData, week_day: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="partner_open_at">Opens At</Label>
                      <Input
                        id="partner_open_at"
                        type="time"
                        value={formData.open_at}
                        onChange={(e) => setFormData({ ...formData, open_at: e.target.value })}
                        placeholder="23:59"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partner_close_at">Closes At</Label>
                      <Input
                        id="partner_close_at"
                        type="time"
                        value={formData.close_at}
                        onChange={(e) => setFormData({ ...formData, close_at: e.target.value })}
                        placeholder="23:59"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Hours"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Open At</TableHead>
                  <TableHead>Close At</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : !hours || hours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState
                        title="No default working hours defined"
                        description="Add opening and closing times for each day of the week."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  [...hours].sort((a, b) => WEEKDAYS.indexOf(a.week_day) - WEEKDAYS.indexOf(b.week_day)).map((hour) => (
                    <TableRow key={hour.id}>
                      <TableCell className="font-medium capitalize">{hour.week_day}</TableCell>
                      <TableCell>{hour.open_at}</TableCell>
                      <TableCell>{hour.close_at}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={() => deleteMutation.mutate(hour.id)}
                          disabled={deleteMutation.isPending}
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
    </div>
  );
}
