
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, BookOpen, X, CalendarIcon, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "@/components/ui/image";
import { useQueryState, parseAsInteger } from "nuqs";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/layout/page-header";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { format } from "date-fns";
import { storiesApi } from "@/lib/api/domains/stories";
import type { Story, StoryWithItems, CreateStoryRequest } from "@/lib/api/schemas/stories";

function dateToIso(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

function isoToApi(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getTimeFromIso(iso: string): string {
  if (!iso) return "00:00";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "00:00";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setTimeOnIso(iso: string, time: string): string {
  const d = iso ? new Date(iso) : new Date();
  const [hh, mm] = time.split(":").map(Number);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.toISOString();
}

const defaultForm: CreateStoryRequest = {
  title: "",
  is_active: true,
  sort_order: 0,
  start_date: "",
  end_date: "",
};

function DateTimePicker({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (iso: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;
  const hasValue = !!value && !isNaN(new Date(value).getTime());

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !hasValue && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {hasValue ? format(date!, "dd/MM/yyyy") : "Pick a date"}
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                className="ml-auto"
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onClear(); } }}
              >
                <X className="h-4 w-4 opacity-50 hover:opacity-100" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                const prev = value ? new Date(value) : new Date();
                d.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                onChange(d.toISOString());
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {hasValue && (
        <Input
          type="time"
          value={getTimeFromIso(value)}
          onChange={(e) => onChange(setTimeOnIso(value, e.target.value))}
        />
      )}
    </div>
  );
}

function StoryPreview({
  story,
  onClose,
}: {
  story: StoryWithItems;
  onClose: () => void;
}) {
  const items = story.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const currentItem = items[currentIndex];
  const duration = (currentItem?.duration || 5) * 1000;

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, items.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (paused || items.length === 0) return;
    const interval = 50;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (interval / duration) * 100;
        if (next >= 100) {
          goNext();
          return 0;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [paused, duration, goNext, items.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") { goNext(); }
      if (e.key === "ArrowLeft") { goPrev(); }
      if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  if (items.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
        <div className="text-white text-center">
          <p className="text-lg font-medium">No slides in this story</p>
          <p className="text-sm text-white/60 mt-2">Add slides to preview the story</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="relative w-[375px] h-[667px] bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slide image */}
        {currentItem?.image_url ? (
          <Image
            src={currentItem.image_url}
            alt={currentItem.title || "Slide"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Progress bars */}
        <div className="absolute top-3 inset-x-3 flex gap-1">
          {items.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-75"
                style={{
                  width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 inset-x-3 flex items-center gap-3">
          {story.image_url ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-white shrink-0">
              <Image src={story.image_url} alt={story.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
          )}
          <span className="text-white text-sm font-medium truncate">{story.title}</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setPaused((p) => !p)}
              className="p-1 text-white/80 hover:text-white"
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button onClick={onClose} className="p-1 text-white/80 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tap zones for prev/next */}
        <button
          className="absolute left-0 top-16 bottom-24 w-1/3 cursor-pointer"
          onClick={goPrev}
          aria-label="Previous slide"
        />
        <button
          className="absolute right-0 top-16 bottom-24 w-1/3 cursor-pointer"
          onClick={goNext}
          aria-label="Next slide"
        />

        {/* Bottom content */}
        <div className="absolute bottom-6 inset-x-4 text-white">
          {currentItem?.title && (
            <p className="text-base font-semibold drop-shadow-lg">{currentItem.title}</p>
          )}
          {currentItem?.description && (
            <p className="text-sm text-white/80 mt-1 line-clamp-3 drop-shadow-lg">{currentItem.description}</p>
          )}
        </div>

        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 text-white/80 hover:text-white hover:bg-black/50"
            onClick={goPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {currentIndex < items.length - 1 && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/30 text-white/80 hover:text-white hover:bg-black/50"
            onClick={goNext}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function StoriesContent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editStory, setEditStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState<CreateStoryRequest>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewStoryId, setPreviewStoryId] = useState<number | null>(null);

  const { data: storiesData, isLoading } = useQuery({
    queryKey: ["stories", currentPage, perPage],
    queryFn: () => storiesApi.getAll({ page: currentPage, limit: perPage }),
  });

  const stories = storiesData?.data || [];
  const totalPages = storiesData?.meta?.totalPages || 1;

  const { data: previewStory } = useQuery({
    queryKey: ["stories", previewStoryId],
    queryFn: () => storiesApi.getById(previewStoryId!),
    enabled: !!previewStoryId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["stories"] });

  const createMutation = useMutation({
    mutationFn: ({ data, file }: { data: CreateStoryRequest; file?: File }) => storiesApi.create(data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Story created successfully!");
      setIsCreateOpen(false);
      setFormData(defaultForm);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to create story"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, file }: { id: number; data: Partial<CreateStoryRequest>; file?: File }) =>
      storiesApi.update(id, data, file),
    onSuccess: () => {
      invalidate();
      toast.success("Story updated successfully!");
      setEditStory(null);
      setSelectedFile(null);
    },
    onError: () => toast.error("Failed to update story"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      storiesApi.update(id, { is_active }),
    onSuccess: () => {
      invalidate();
      toast.success("Story status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: storiesApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Story deleted successfully!");
    },
    onError: () => toast.error("Failed to delete story"),
  });

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.start_date) payload.start_date = isoToApi(payload.start_date);
    if (payload.end_date) payload.end_date = isoToApi(payload.end_date);
    createMutation.mutate({ data: payload, file: selectedFile || undefined });
  }

  function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editStory) return;
    const payload = { ...formData };
    if (payload.start_date) payload.start_date = isoToApi(payload.start_date);
    if (payload.end_date) payload.end_date = isoToApi(payload.end_date);
    updateMutation.mutate({ id: editStory.id, data: payload, file: selectedFile || undefined });
  }

  function openEdit(story: Story) {
    setEditStory(story);
    setFormData({
      title: story.title || "",
      sort_order: story.sort_order,
      is_active: story.is_active,
      start_date: dateToIso(story.start_date),
      end_date: dateToIso(story.end_date),
    });
    setSelectedFile(null);
  }

  const formFields = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Story title"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={formData.sort_order ?? 0}
            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <Switch
            checked={formData.is_active ?? true}
            onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
          />
          <Label>Active</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Start Date (Optional)</Label>
          <DateTimePicker
            value={formData.start_date || ""}
            onChange={(v) => setFormData({ ...formData, start_date: v })}
            onClear={() => setFormData({ ...formData, start_date: "" })}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date (Optional)</Label>
          <DateTimePicker
            value={formData.end_date || ""}
            onChange={(v) => setFormData({ ...formData, end_date: v })}
            onClear={() => setFormData({ ...formData, end_date: "" })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        {(selectedFile || editStory?.image_url) && (() => {
          const src = selectedFile ? URL.createObjectURL(selectedFile) : editStory?.image_url || "";
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
        {editStory && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stories"
        description="Publish stories with timed slides shown in the mobile app."
        action={
          <Button
            onClick={() => {
              setFormData(defaultForm);
              setSelectedFile(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add story
          </Button>
        }
      />

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[64px]">ID</TableHead>
              <TableHead className="w-[64px]">Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Slides</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : stories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    title="No stories yet"
                    description="Publish your first story to engage users in the mobile app."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(defaultForm);
                          setSelectedFile(null);
                          setIsCreateOpen(true);
                        }}
                      >
                        <Plus className="size-4" />
                        Add story
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              stories.map((story) => (
                <TableRow
                  key={story.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/stories/${story.id}`)}
                >
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    #{story.id}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {story.image_url ? (
                      <button
                        type="button"
                        className="relative size-9 overflow-hidden rounded-md ring-1 ring-border transition-opacity hover:opacity-80"
                        onClick={() => setPreviewImage(story.image_url!)}
                      >
                        <Image src={story.image_url} alt={story.title} fill className="object-cover" />
                      </button>
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{story.title}</TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {story.item_count ?? 0}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {story.sort_order}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={story.is_active}
                      onCheckedChange={(v) => toggleActiveMutation.mutate({ id: story.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {story.start_date ? new Date(story.start_date).toLocaleDateString("ru-RU") : "—"}
                    </span>
                    <span className="px-1">→</span>
                    <span className="font-mono tabular-nums">
                      {story.end_date ? new Date(story.end_date).toLocaleDateString("ru-RU") : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPreviewStoryId(story.id)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(story)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(story.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          perPage={perPage}
          onPerPageChange={(v) => {
            setPerPage(v);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </DataTableShell>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
            <DialogDescription>Add a new story</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            {formFields}
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
      <Dialog open={!!editStory} onOpenChange={(open) => {
        if (!open) { setEditStory(null); setSelectedFile(null); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
            <DialogDescription>Update story settings</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            {formFields}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditStory(null); setSelectedFile(null); }}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
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
            <DialogDescription>Story image preview</DialogDescription>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Story preview" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>

      {/* Story Preview */}
      {previewStoryId && previewStory && (
        <StoryPreview
          story={previewStory}
          onClose={() => setPreviewStoryId(null)}
        />
      )}
    </div>
  );
}

export default function StoriesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading stories...</div>}>
      <StoriesContent />
    </Suspense>
  );
}
