import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function TrackEditDialog({
  track,
  open,
  onOpenChange,
}: {
  track: ApiTrack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!track) return;
    setTitle(track.title || "");
    setArtist(track.artist || "");
    setAlbum(track.album || "");
    setCoverImage(track.coverImage || "");
  }, [track]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!track) return;
      await tracksApi.update(track.id, { title, artist, album, coverImage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      toast({ title: "Track updated", description: "Metadata saved successfully." });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit song details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" />
          <Input value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album" />
          <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="Cover image URL (optional)" />
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !title.trim() || !artist.trim()}
            className="w-full"
          >
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
