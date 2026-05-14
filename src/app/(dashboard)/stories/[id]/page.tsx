
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, BookOpen, X, Check, ChevronsUpDown } from "lucide-react";
import Image from "@/components/ui/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { storiesApi, storyItemsApi } from "@/lib/api/domains/stories";
import { partnersApi } from "@/lib/api/domains/partners";
import { drinksApi } from "@/lib/api/domains/drinks";
import type { StoryItem, CreateStoryItemRequest } from "@/lib/api/schemas/stories";

const LINK_TYPE_LABELS: Record<string, string> = { partner: "Partner", drink: "Drink", url: "URL" };

function SearchableSelect({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  items,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  items: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {selected ? selected.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const defaultItemForm: Omit<CreateStoryItemRequest, "story_id"> = {
  title: "",
  description: "",
  link_type: "",
  link_value: "",
  sort_order: 0,
  duration: 5,
};

function StoryDetailContent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams();
  const storyId = Number(params.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<StoryItem | null>(null);
  const [formData, setFormData] = useState(defaultItemForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data: story, isLoading } = useQuery({
    queryKey: ["stories", storyId],
    queryFn: () => storiesApi.getById(storyId),
    enabled: !!storyId,
  });

  const { data: partnersData } = useQuery({
    queryKey: ["partners-all"],
    queryFn: () => partnersApi.getAll({ limit: 100 }),
  });
  const partners = partnersData?.data || [];

  const { data: drinksData } = useQuery({
    queryKey: ["drinks-all"],
    queryFn: () => drinksApi.getAll({ limit: 100 }),
  });
  const drinks = drinksData?.data || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["stories", storyId] });

  const createItemMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateStoryItemRequest; file?: File }) =>
      storyItemsApi.create(data, file),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Slide added successfully!");
      setIsCreateOpen(false);
      setFormData(defaultItemForm);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to add slide"),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateStoryItemRequest>; file?: File }) =>
      storyItemsApi.update(id, data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Slide updated successfully!");
      setEditItem(null);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to update slide"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: storyItemsApi.delete,
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Slide deleted successfully!");
    },
    onError: () => toast.error("Failed to delete slide"),
  });

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    createItemMutation.mutate({
      data: { ...formData, story_id: storyId },
      file: selectedFile || undefined,
    });
  }

  function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    updateItemMutation.mutate({
      id: editItem.id,
      data: formData,
      file: selectedFile || undefined,
    });
  }

  function openEdit(item: StoryItem) {
    setEditItem(item);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      link_type: item.link_type || "",
      link_value: item.link_value || "",
      sort_order: item.sort_order,
      duration: item.duration,
    });
    setSelectedFile(null);
  }

  const items = story?.items || [];

  const formFields = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title (Optional)</Label>
        <Input
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Slide title"
        />
      </div>

      <div className="space-y-2">
        <Label>Description (Optional)</Label>
        <Textarea
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Slide description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Link Type (Optional)</Label>
        <Select
          value={formData.link_type || "none"}
          onValueChange={(v) => setFormData({ ...formData, link_type: v === "none" ? "" : v, link_value: "" })}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="drink">Drink</SelectItem>
            <SelectItem value="url">URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.link_type && formData.link_type !== "none" && (
        <div className="space-y-2">
          <Label>Link Value</Label>
          {formData.link_type === "partner" ? (
            <SearchableSelect
              value={formData.link_value || ""}
              onValueChange={(v) => setFormData({ ...formData, link_value: v })}
              placeholder="Select partner..."
              searchPlaceholder="Search partners..."
              items={partners.map((p) => ({ value: String(p.id), label: p.name }))}
            />
          ) : formData.link_type === "drink" ? (
            <SearchableSelect
              value={formData.link_value || ""}
              onValueChange={(v) => setFormData({ ...formData, link_value: v })}
              placeholder="Select drink..."
              searchPlaceholder="Search drinks..."
              items={drinks.map((d) => ({ value: String(d.id), label: d.name }))}
            />
          ) : (
            <Input
              value={formData.link_value || ""}
              onChange={(e) => setFormData({ ...formData, link_value: e.target.value })}
              placeholder="https://..."
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={formData.sort_order ?? 0}
            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (seconds)</Label>
          <Input
            type="number"
            min={1}
            value={formData.duration ?? 5}
            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Slide Image</Label>
        {(selectedFile || editItem?.image_url) && (() => {
          const src = selectedFile ? URL.createObjectURL(selectedFile) : editItem?.image_url || "";
          return (
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setPreviewImage(src)}
                className="block overflow-hidden rounded-lg border hover:opacity-80 transition-opacity"
              >
                <img src={src} alt="Preview" className="max-h-24 w-auto object-contain" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })()}
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
          }}
        />
        {editItem && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading story...</div>;
  }

  if (!story) {
    return <div className="p-8 text-center text-muted-foreground">Story not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/stories")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          {story.image_url ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-lg shrink-0">
              <Image src={story.image_url} alt={story.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted shrink-0">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{story.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={story.is_active ? "default" : "secondary"}>
                {story.is_active ? "Active" : "Inactive"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {items.length} slide{items.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Slides</h2>
        <Button onClick={() => { setFormData(defaultItemForm); setSelectedFile(null); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Slide
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No slides yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">#{item.id}</TableCell>
                  <TableCell>
                    {item.image_url ? (
                      <button
                        type="button"
                        className="relative h-10 w-16 overflow-hidden rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewImage(item.image_url!)}
                      >
                        <Image src={item.image_url} alt={item.title || "Slide"} fill className="object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-10 w-16 items-center justify-center rounded bg-muted">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{item.title || "—"}</span>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.link_type ? (
                      <>
                        <Badge variant="secondary">{LINK_TYPE_LABELS[item.link_type] || item.link_type}</Badge>
                        {item.link_value && (
                          <span className="ml-2 text-xs text-muted-foreground">{item.link_value}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{item.sort_order}</TableCell>
                  <TableCell>{item.duration}s</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive cursor-pointer"
                        onClick={() => deleteItemMutation.mutate(item.id)}
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

      {/* Create Item Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Slide</DialogTitle>
            <DialogDescription>Add a new slide to this story</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending ? "Adding..." : "Add Slide"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => {
        if (!open) { setEditItem(null); setSelectedFile(null); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Slide</DialogTitle>
            <DialogDescription>Update slide settings</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditItem(null); setSelectedFile(null); }}>Cancel</Button>
              <Button type="submit" disabled={updateItemMutation.isPending}>
                {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Slide image preview</DialogDescription>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Slide preview" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StoryDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading story...</div>}>
      <StoryDetailContent />
    </Suspense>
  );
}
