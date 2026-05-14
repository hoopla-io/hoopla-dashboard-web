import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ImageIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shopsApi } from "@/lib/api/domains/shops";

interface PicturesTabProps {
  shopId: number;
}

export function PicturesTab({ shopId }: PicturesTabProps) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);

  const { data: pictures, isLoading } = useQuery({
    queryKey: ["shop-pictures", shopId],
    queryFn: () => shopsApi.getPictures(shopId),
    enabled: !!shopId,
  });

  console.log({pictures})

  const uploadMutation = useMutation({
    mutationFn: (file: File) => shopsApi.uploadPicture(shopId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-pictures", shopId] });
      toast.success("Picture added successfully!");
      setIsAddOpen(false);
      setSelectedFile(undefined);
    },
    onError: () => toast.error("Failed to upload picture"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shopsApi.deletePicture(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-pictures", shopId] });
      toast.success("Picture deleted successfully!");
    },
    onError: () => toast.error("Failed to delete picture"),
  });

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

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    } else {
      toast.error("Please select a file");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Shop Pictures</CardTitle>
            <CardDescription>Manage your shop&apos;s gallery</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Picture
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Shop Picture</DialogTitle>
                <DialogDescription>
                  Upload a new picture for your shop. Recommended size: 800x600px.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="picture">Select Image (JPG/PNG)</Label>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading pictures...</div>
          ) : !pictures || pictures.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-lg">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No pictures yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pictures.map((pic) => (
                <div key={pic.id} className="group relative aspect-square rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={pic.image_url}
                    alt="Shop"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteMutation.mutate(pic.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
